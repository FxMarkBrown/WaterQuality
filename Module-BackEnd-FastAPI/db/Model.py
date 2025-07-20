# 基础模型类
from sqlalchemy import Column, Integer, String, DateTime, Float
from sqlalchemy.orm import declarative_base

Base = declarative_base()
# 定义数据模型
class Model(Base):
    __tablename__ = "model"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False)
    target = Column(String(50), nullable=False)  # PH, DO或NH3N
    method = Column(String(50))  # AdaBoost或SVM
    rmse = Column(Float)  # 均方根误差
    uid = Column(Integer, nullable=False)
    date = Column(DateTime, nullable=False)
# 定义WaterQuality表
class WaterQuality(Base):
    __tablename__ = "waterquality"

    id = Column(Integer, primary_key=True, index=True)
    PH = Column(Float, nullable=False)
    DO = Column(Float, nullable=False)
    NH3N = Column(Float, nullable=False)
    date = Column(DateTime, nullable=False)
    station = Column(Integer, nullable=False)