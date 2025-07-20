import os
from datetime import datetime

import pandas as pd
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from sklearn.preprocessing import StandardScaler
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from db.Model import Model, WaterQuality
from trainers.AdaBoostTrainer import AdaBoostTrainer
from trainers.BiRNNTrainer import BiRNNTrainer
from trainers.GRUTrainer import GRUTrainer
from trainers.LSTMTrainer import LSTMTrainer
from trainers.SVMTrainer import SVMTrainer
from tuners.Bayesian.BiRNNBayesianTuner import BiRNNBayesianTuner
from tuners.Bayesian.GRUBayesianTuner import GRUBayesianOptimizationTuner
from tuners.Bayesian.LSTMBayesianTuner import LSTMBayesianOptimizationTuner
from tuners.Random.BiRNNRandomTuner import BiRNNSearchTuner
from tuners.Random.GRURandomTuner import GRURandomSearchTuner
from tuners.Random.LSTMRandomTuner import LSTMRandomSearchTuner

########################### 数据库 ###########################
# 数据库连接配置
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "Ainiduo1.")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "water")
##############################################################


########################### 初始化 ###########################
# 加载环境变量
load_dotenv()
# 创建FastAPI应用
app = FastAPI()
# 创建数据库引擎
engine = create_engine(
    f"mysql+mysqlconnector://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)
# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
##############################################################

########################### 工具函数 ###########################
# 统一基准时间：Unix时间戳起始点 - 1970年1月1日 00:00:00
UNIX_EPOCH = datetime(1970, 1, 1)

def get_extract_time_features(date: datetime) -> dict:
    """
    从datetime中提取时间特征
    """
    return {
        'year': date.year,
        'month': date.month,
        'day': date.day,
        'day_of_week': date.weekday(),  # 0=周一，6=周日
        'hour': date.hour,
        'day_of_year': date.timetuple().tm_yday
    }

def calculate_next_month(start_year: int, start_month: int) -> datetime:
    """
    计算下一个月的日期
    """
    month = start_month + 1
    year = start_year

    if month > 12:
        month = 1
        year += 1

    return datetime(year, month, 1)  # 每月第一天
##############################################################

########################### 网络IO ###########################
@app.get("/api/training")
async def train_model(model_id: int):
    """
    模型训练接口
    :param model_id: 模型ID DB获得
    :return: 训练结果（包含模型RMSE和各样本点的原始值/预测值）
    """
    print(f"收到来自SpringBoot的模型训练请求, 模型ID: {model_id}")
    db = SessionLocal()

    try:
        # 查询模型信息
        # noinspection PyTypeChecker
        model_info = db.query(Model).filter(Model.id == model_id).first()

        if not model_info:
            raise HTTPException(status_code=404, detail=f"模型ID {model_id} 不存在")

        # 获取目标列和训练方法
        target_name = model_info.target
        method = model_info.method

        # 验证method和target
        if model_info.method not in ["ADABOOST", "SVM", "LSTM", "GRU", "BI-RNN"]:
            raise HTTPException(status_code=400, detail=f"不支持的模型方法: {model_info.method}")

        if target_name not in ["PH", "DO", "NH3N"]:
            raise HTTPException(status_code=400, detail=f"不支持的目标变量: {target_name}")

        print(f"- 训练方式: {model_info.method}")

        # 查询水质数据
        # noinspection PyTypeChecker
        target_column = getattr(WaterQuality, target_name)
        water_quality_data = (
            db.query(
                WaterQuality.date,
                target_column
            ).filter(target_column.isnot(None))
            .order_by(WaterQuality.date)
            .all()
        )

        if not water_quality_data or len(water_quality_data) < 10:
            raise HTTPException(status_code=400, detail=f"数据不足，无法训练模型")

        print(f"- 样本量: {len(water_quality_data)}")

        # Pandas特征工程
        df = pd.DataFrame({
            # 时间特征
            'date': [data[0] for data in water_quality_data],
            # 指标的值
            target_name: [data[1] for data in water_quality_data]
        })

        # 计算相对时间差（以UNIX_EPOCH为基准，小时为单位）
        df['time_diff_hours'] = df['date'].apply(
            lambda x: (x - UNIX_EPOCH).total_seconds() / 3600
        )

        # 提取时间特征
        time_features = df['date'].apply(lambda x: pd.Series(get_extract_time_features(x)))
        # 拼接时间差列
        df = pd.concat([df, time_features], axis=1)

        # 准备特征和目标变量
        features = [
            'time_diff_hours',
            'year',
            'month',
            'day',
            'day_of_week',
            'hour',
            'day_of_year'
        ]
        X = df[features].values
        y = df[target_name].values

        # 数据标准化
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        # 选择模型
        if method == "ADABOOST":
            trainer = AdaBoostTrainer(model_id, target_name, scaler)
        elif method == "SVM":
            trainer = SVMTrainer(model_id, target_name, scaler)
        elif method == "LSTM":
            trainer = LSTMTrainer(model_id, target_name, scaler)
        elif method == "GRU":
            trainer = GRUTrainer(model_id, target_name, scaler)
        else:
            trainer = BiRNNTrainer(model_id, target_name, scaler)

        # 训练模型
        rmse, _, y_test, y_pred = trainer.train(X_scaled, y)

        # 更新模型RMSE到数据库
        model_info.rmse = rmse
        db.commit()

        # 构建预测结果和真实值的对比数据
        print("模型拟合完毕, 发回请求...")
        return {
            "status": "success",
            "data": {
                "rmse": rmse,
                "pred": y_pred.tolist(),
                "real": y_test.tolist()
            }
        }

    except Exception as e:
        print(e)
        return { "status": "failure" }
    finally:
        db.close()


@app.get("/api/prediction")
async def predict_next_point(
        model_id: int,
        month: int
):
    """
    模型预测接口
    :param model_id: 模型ID DB获得
    :param month: 待预测月份
    :return 预测结果
    """
    print(f"收到预测请求, 模型ID: {model_id}, 预测月: {month}")

    try:
        if not 1 <= month <= 12:
            raise HTTPException(status_code=400, detail="起始月份必须在1-12之间")

        # 获取模型信息
        db = SessionLocal()
        # noinspection PyTypeChecker
        model_info = db.query(Model).filter(Model.id == model_id).first()
        db.close()

        if not model_info:
            raise HTTPException(status_code=404, detail=f"模型ID {model_id} 不存在")

        # 加载对应的训练器
        method = model_info.method
        if method == "ADABOOST":
            trainer = AdaBoostTrainer(model_id, model_info.target)
        elif method == "SVM":
            trainer = SVMTrainer(model_id, model_info.target)
        elif method == "LSTM":
            trainer = LSTMTrainer(model_id, model_info.target)
        elif method == "GRU":
            trainer = GRUTrainer(model_id, model_info.target)
        else:
            trainer = BiRNNTrainer(model_id, model_info.target)

        if not trainer.load_model():
            raise HTTPException(status_code=404, detail="模型未找到或未训练")

        # 生成预测特征
        pred_date = calculate_next_month(datetime.now().year, month)
        time_features = get_extract_time_features(pred_date)
        time_diff_hours = (pred_date - UNIX_EPOCH).total_seconds() / 3600

        features = [
            time_diff_hours,
            time_features['year'],
            time_features['month'],
            time_features['day'],
            time_features['day_of_week'],
            time_features['hour'],
            time_features['day_of_year'],
        ]

        # 预测
        prediction = trainer.predict([features])[0]

        return {
            "status": "success",
            "data": {"pred": float(prediction)}
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"预测错误: {str(e)}")
        return { "status": "failure" }

@app.get("/api/tuning")
async def tune_model(
        model_id: int,
        method: str
):
    """
    模型调优接口
    :param model_id: 模型ID DB获得
    :param method: 调优方法：random（随机搜索）、bayesian（贝叶斯优化）
    :return: 调优结果（最佳RMSE和参数）
    """
    print(f"收到调优请求 - 模型ID: {model_id}, 方法: {method}")
    db = SessionLocal()

    try:
        # 验证模型存在性
        # noinspection PyTypeChecker
        model_info = db.query(Model).filter(Model.id == model_id).first()
        if not model_info:
            raise HTTPException(status_code=404, detail=f"模型ID {model_id} 不存在")

        # 验证模型类型匹配
        model_type = model_info.method
        if model_type not in ["LSTM", "GRU", "BI-RNN"]:
            raise HTTPException(status_code=400, detail=f"不支持的模型类型: {model_type}")

        if model_info.method != model_type.upper():
            raise HTTPException(
                status_code=400,
                detail=f"模型ID {model_id} 不是{model_type.upper()}模型（实际: {model_info.method}）"
            )

        # 获取训练数据
        target_name = model_info.target
        # noinspection PyTypeChecker
        target_column = getattr(WaterQuality, target_name)
        water_quality_data = (
            db.query(WaterQuality.date, target_column)
            .filter(target_column.isnot(None))
            .order_by(WaterQuality.date)
            .all()
        )

        if not water_quality_data or len(water_quality_data) < 10:
            raise HTTPException(status_code=400, detail="数据不足（需至少10条样本）")

        # 特征工程
        df = pd.DataFrame({
            'date': [data[0] for data in water_quality_data],
            target_name: [data[1] for data in water_quality_data]
        })
        df['time_diff_hours'] = df['date'].apply(
            lambda x: (x - UNIX_EPOCH).total_seconds() / 3600
        )
        time_features = df['date'].apply(lambda x: pd.Series(get_extract_time_features(x)))
        df = pd.concat([df, time_features], axis=1)

        features = ['time_diff_hours', 'year', 'month', 'day', 'day_of_week', 'hour', 'day_of_year']
        X = df[features].values
        y = df[target_name].values

        # 初始化调优器
        scaler = StandardScaler()
        tuner = None

        # 根据模型类型和调优方法选择调优器
        if model_type == "LSTM":
            if method == "random":
                tuner = LSTMRandomSearchTuner(
                    model_id=model_id,
                    target_name=target_name,
                    scaler=scaler,
                    db_session=db,
                    n_iter=15
                )
            else:
                tuner = LSTMBayesianOptimizationTuner(
                    model_id=model_id,
                    target_name=target_name,
                    scaler=scaler,
                    db_session=db,
                    max_evals=15
                )

        elif model_type == "GRU":
            if method == "random":
                tuner = GRURandomSearchTuner(
                    model_id=model_id,
                    target_name=target_name,
                    scaler=scaler,
                    db_session=db,
                    n_iter=15
                )
            else:
                tuner = GRUBayesianOptimizationTuner(
                    model_id=model_id,
                    target_name=target_name,
                    scaler=scaler,
                    db_session=db,
                    max_evals=15
                )

        elif model_type == "BI-RNN":
            if method == "random":
                tuner = BiRNNSearchTuner(
                    model_id=model_id,
                    target_name=target_name,
                    scaler=scaler,
                    db_session=db,
                    n_iter=15
                )
            else:
                tuner = BiRNNBayesianTuner(
                    model_id=model_id,
                    target_name=target_name,
                    scaler=scaler,
                    db_session=db,
                    max_evals=15
                )

        # 执行调优
        result = tuner.tune(X, y)

        return {
            "status": "success",
            "data": {
                "best_rmse": round(result["best_rmse"], 4),
                "best_params": result["best_params"],
            }
        }

    except Exception as e:
        # 未知错误
        print(f"调优失败: {str(e)}")
        return { "status": "failure" }
    finally:
        db.close()

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)