import numpy as np
import torch
from hyperopt import fmin, tpe, hp, Trials
from sklearn.model_selection import train_test_split

from db.Model import Model
from trainers.BiRNNTrainer import BiRNNModel
from tuners.BaseTunner import BaseTuner


class BiRNNBayesianTuner(BaseTuner):
    def __init__(self, model_id, target_name, scaler, db_session, max_evals=20):
        super().__init__(model_id, target_name, scaler, db_session)
        self.max_evals = max_evals  # 贝叶斯优化评估次数
        self.hidden_size_options = [32, 64, 128, 256]
        self.num_layers_options = [1, 2, 3]
        self.batch_size_options = [16, 32, 64, 128]
        self.epochs_options = [50, 100, 150, 200]
        self.dropout_options = [0.1, 0.2, 0.3]

    def get_param_space(self):
        """ 定义Bi-RNN的贝叶斯优化参数空间 """
        return {
            'hidden_size': hp.choice('hidden_size', self.hidden_size_options),
            'num_layers': hp.choice('num_layers', self.num_layers_options),
            'learning_rate': hp.loguniform('learning_rate', np.log(0.0005), np.log(0.01)),
            'batch_size': hp.choice('batch_size', self.batch_size_options),
            'epochs': hp.choice('epochs', self.epochs_options),
            'dropout': hp.choice('dropout', self.dropout_options)
        }

    def create_model(self, params):
        """ 创建Bi-RNN模型 """
        # 转换hyperopt索引为实际参数值
        params = {
            'hidden_size': params['hidden_size'],
            'num_layers': params['num_layers'],
            'learning_rate': max(0.0001, min(0.01, params['learning_rate'])),
            'batch_size': params['batch_size'],
            'epochs': params['epochs'],
            'dropout': params['dropout']
        }

        return BiRNNModel(
            input_size=7,
            hidden_size=params['hidden_size'],
            num_layers=params['num_layers'],
            dropout=params['dropout']
        ).to(self.device)

    def tune(self, X, y):
        """执行贝叶斯优化"""
        print(f"开始Bi-RNN贝叶斯优化调优（最大评估{self.max_evals}次）")

        # 预处理数据
        X_reshaped, y_reshaped = self.preprocess_data(X, y)

        # 划分训练集和测试集
        X_train, X_test, y_train, y_test = train_test_split(
            X_reshaped, y_reshaped, test_size=0.2, random_state=42
        )

        # 转换为张量
        X_train = torch.FloatTensor(X_train).to(self.device)
        X_test = torch.FloatTensor(X_test).to(self.device)
        y_train = torch.FloatTensor(y_train).to(self.device)
        y_test = torch.FloatTensor(y_test).to(self.device)

        # 定义目标函数
        def objective(params):
            print(f"尝试参数组合: {params}")

            # 创建并评估模型
            model = self.create_model(params)
            rmse = self.evaluate_model(model, X_train, X_test, y_train, y_test, params)

            return rmse  # 最小化RMSE

        # 执行优化
        trials = Trials()
        best = fmin(
            fn=objective,
            space=self.get_param_space(),
            algo=tpe.suggest,
            max_evals=self.max_evals,
            trials=trials
        )

        # 解析最佳参数
        best_params = {
            'hidden_size': [32, 64, 128, 256][best['hidden_size']],
            'num_layers': [1, 2, 3][best['num_layers']],
            'learning_rate': best['learning_rate'],
            'batch_size': [16, 32, 64, 128][best['batch_size']],
            'epochs': [50, 100, 150, 200][best['epochs']],
            'dropout': [0.1, 0.2, 0.3][best['dropout']]
        }

        # 更新数据库
        # noinspection PyTypeChecker
        model_info = self.db_session.query(Model).filter(Model.id == self.model_id).first()
        if model_info:
            model_info.rmse = self.best_rmse
            self.db_session.commit()

        return {
            "best_rmse": self.best_rmse,
            "best_params": best_params,
            "method": "bayesian_optimization"
        }