import random

import torch
from sklearn.model_selection import train_test_split

from db.Model import Model
from trainers.GRUTrainer import GRUModel
from tuners.BaseTunner import BaseTuner


class GRURandomSearchTuner(BaseTuner):
    def __init__(self, model_id, target_name, scaler, db_session, n_iter=20):
        super().__init__(model_id, target_name, scaler, db_session)
        self.n_iter = n_iter

    def get_param_space(self):
        """ 定义GRU的随机搜索参数空间 """
        return {
            'hidden_size': [32, 64, 128, 256],
            'num_layers': [1, 2, 3],
            'learning_rate': [0.0005, 0.001, 0.005, 0.01],
            'batch_size': [16, 32, 64, 128],
            'epochs': [50, 100, 150, 200],
            'dropout': [0.0, 0.1, 0.2, 0.3]
        }

    def create_model(self, params):
        """ 创建GRU模型 """
        return GRUModel(
            input_size=7,
            hidden_size=params['hidden_size'],
            num_layers=params['num_layers'],
            dropout=params['dropout']
        ).to(self.device)

    def tune(self, X, y):
        """执行随机搜索"""
        print(f"开始GRU随机搜索调优（尝试{self.n_iter}次）")

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

        # 获取参数空间
        param_space = self.get_param_space()

        # 随机尝试参数组合
        for i in range(self.n_iter):
            print(f"尝试参数组合 {i + 1}/{self.n_iter}")

            # 随机生成参数组合
            params = {
                'hidden_size': random.choice(param_space['hidden_size']),
                'num_layers': random.choice(param_space['num_layers']),
                'learning_rate': random.choice(param_space['learning_rate']),
                'batch_size': random.choice(param_space['batch_size']),
                'epochs': random.choice(param_space['epochs']),
                'dropout': random.choice(param_space['dropout'])
            }

            # 创建并评估模型
            model = self.create_model(params)
            self.evaluate_model(model, X_train, X_test, y_train, y_test, params)

        # 更新数据库中的最佳RMSE
        # noinspection PyTypeChecker
        model_info = self.db_session.query(Model).filter(Model.id == self.model_id).first()
        if model_info:
            model_info.rmse = self.best_rmse
            self.db_session.commit()

        return {
            "best_rmse": self.best_rmse,
            "best_params": self.best_params,
        }