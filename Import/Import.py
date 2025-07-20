import os

import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from db.Model import WaterQuality

########################### 数据库 ###########################
# 数据库连接配置
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "root")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "water")
##############################################################

# 创建数据库连接和模型基类
engine = create_engine(
    f"mysql+mysqlconnector://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

# 创建会话
Session = sessionmaker(bind=engine)
session = Session()

def import_excel_to_db(file_path):
    """从Excel导入数据到数据库"""
    try:
        # 读取Excel文件
        df = pd.read_excel(file_path)

        # 确保必要的列存在
        required_columns = ['监测时间', 'pH', '溶解氧(mg/L)', '氨氮(mg/L)']
        for col in required_columns:
            if col not in df.columns:
                raise ValueError(f"Excel文件中缺少必要的列: {col}")

        # 遍历数据行并添加到数据库
        for index, row in df.iterrows():
            # 转换日期格式
            date_str = row['监测时间']
            db_date = pd.to_datetime(date_str).strftime('%Y-%m-%d %H:%M:%S')
            if not db_date:
                continue

            # 创建数据记录
            record = WaterQuality(
                PH=row['pH'] if pd.notna(row['pH']) else None,
                DO=row['溶解氧(mg/L)'] if pd.notna(row['溶解氧(mg/L)']) else None,
                NH3N=row['氨氮(mg/L)'] if pd.notna(row['氨氮(mg/L)']) else None,
                date=db_date,
                station=0
            )

            # 添加到会话
            session.add(record)

            # 每1000条记录提交一次
            if (index + 1) % 1000 == 0:
                session.commit()
                print(f"已导入 {index + 1} 条记录")

        # 提交剩余的记录
        session.commit()
        print(f"成功导入 {len(df)} 条记录")

    except Exception as e:
        print(f"导入过程中发生错误: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    excel_file_path = '水质.xlsx'
    import_excel_to_db(excel_file_path)