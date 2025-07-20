import os
from abc import ABC, abstractmethod

import joblib
import numpy as np
import torch
import torch.nn as nn
from sqlalchemy.orm import Session


class BaseTuner(ABC):
    """
    网络参数调优
    https://blog.fxmarkbrown.top/article/139

    主要针对：
    hidden_size: 隐藏层数
    num_layers: 网络叠加层数
    learning_rate: 学习率
    batch_size: 小批量的样本数量
    epochs: 迭代轮数
    dropout: 随机丢弃概率
    """
    def __init__(self, model_id, target_name, scaler, db_session: Session):
        self.model_id = model_id
        self.target_name = target_name
        self.scaler = scaler
        self.db_session = db_session
        self.best_rmse = float('inf')
        self.best_params = None
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

    @abstractmethod
    def get_param_space(self):
        """ 定义超参数搜索空间 """
        pass

    @abstractmethod
    def create_model(self, params):
        """ 创建模型 """
        pass

    def preprocess_data(self, X, y):
        """ 预处理数据 """
        X_scaled = self.scaler.fit_transform(X)
        y_reshaped = y.reshape(-1, 1)
        X_reshaped = X_scaled.reshape(X_scaled.shape[0], 1, X_scaled.shape[1])
        return X_reshaped, y_reshaped

    def evaluate_model(self, model, X_train, X_test, y_train, y_test, params):
        """ 训练并评估模型 """
        criterion = nn.MSELoss()
        optimizer = torch.optim.Adam(model.parameters(), lr=params['learning_rate'])

        # 训练模型
        model.train()
        for epoch in range(params['epochs']):
            # 创建数据加载器
            train_dataset = torch.utils.data.TensorDataset(X_train, y_train)
            train_loader = torch.utils.data.DataLoader(
                train_dataset, batch_size=params['batch_size'], shuffle=True
            )

            for X_batch, y_batch in train_loader:
                optimizer.zero_grad()
                outputs = model(X_batch)
                loss = criterion(outputs, y_batch)
                loss.backward()
                optimizer.step()

            if (epoch + 1) % 20 == 0:
                print(f"  轮次 [{epoch + 1}/{params['epochs']}], 损失: {loss.item():.4f}")

        # 评估模型
        model.eval()
        with torch.no_grad():
            y_pred = model(X_test).cpu().numpy()
            y_test_np = y_test.cpu().numpy()

        rmse = float(np.sqrt(np.mean((y_test_np - y_pred) ** 2)))
        print(f"  参数组合RMSE: {rmse:.4f}\n")

        # 更新最佳参数
        if rmse < self.best_rmse:
            self.best_rmse = rmse
            self.best_params = params
            # 保存最佳模型
            self.save_best_model(model)

        return rmse

    def save_best_model(self, model):
        """ 保存最佳模型 """
        model_path = f"cached_models/model_{self.model_id}_tuned.pth"
        scaler_path = f"cached_models/scaler_{self.model_id}_tuned.pth"
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        torch.save(model.state_dict(), model_path)
        joblib.dump(self.scaler, scaler_path)

    @abstractmethod
    def tune(self, X, y):
        """执行超参数搜索 """
        pass