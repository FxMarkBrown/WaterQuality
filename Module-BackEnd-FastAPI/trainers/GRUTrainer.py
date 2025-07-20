import os

import joblib
import numpy as np
import torch
import torch.nn as nn
from sklearn.metrics import mean_squared_error
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

from trainers.BaseTrainer import BaseTrainer


class GRUTrainer(BaseTrainer):
    """
    门控循环单元网络(GRN)实现
    https://blog.fxmarkbrown.top/article/137
    """
    def __init__(self, model_id, target_name, scaler=None):
        super().__init__(model_id, target_name, scaler)
        self.scaler = scaler or StandardScaler()
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

    def _build_model(self):
        return GRUModel(input_size=7).to(self.device)

    def train(self, X, y, epochs=100, batch_size=32):
        # 数据标准化
        X_scaled = self.scaler.fit_transform(X)
        y = y.reshape(-1, 1)

        # 转换为GRU输入格式 [samples, time_steps, features]
        X_reshaped = X_scaled.reshape(X_scaled.shape[0], 1, X_scaled.shape[1])

        # 划分训练集和测试集
        X_train, X_test, y_train, y_test = train_test_split(
            X_reshaped, y, test_size=0.2, random_state=42
        )

        # 转换为张量
        X_train = torch.FloatTensor(X_train).to(self.device)
        X_test = torch.FloatTensor(X_test).to(self.device)
        y_train = torch.FloatTensor(y_train).to(self.device)
        y_test = torch.FloatTensor(y_test).to(self.device)

        # 初始化模型、损失函数和优化器
        self.model = self._build_model()
        # 损失函数使用MSE
        criterion = nn.MSELoss()
        # Adam优化器 https://blog.fxmarkbrown.top/article/139
        optimizer = torch.optim.Adam(self.model.parameters(), lr=0.001)

        # 训练循环
        self.model.train()
        for epoch in range(epochs):
            optimizer.zero_grad()
            outputs = self.model(X_train)
            loss = criterion(outputs, y_train)
            loss.backward()
            optimizer.step()

            if (epoch + 1) % 10 == 0:
                print(f'训练: [{epoch + 1}/{epochs}] 轮, 损失: {loss.item():.4f}')

        # 评估模型
        self.model.eval()
        with torch.no_grad():
            y_pred = self.model(X_test).cpu().numpy()
            y_test_np = y_test.cpu().numpy()

        rmse = float(np.sqrt(mean_squared_error(y_test_np, y_pred)))
        self._save_model()
        return rmse, X_test.cpu().numpy().flatten(), y_test_np.flatten(), y_pred.flatten()

    def predict(self, X):
        """预测接口"""
        self.model.eval()
        X_scaled = self.scaler.transform(X)
        X_reshaped = X_scaled.reshape(X_scaled.shape[0], 1, X_scaled.shape[1])
        X_tensor = torch.FloatTensor(X_reshaped).to(self.device)

        with torch.no_grad():
            pred = self.model(X_tensor).cpu().numpy()
        return pred.flatten()

    def _save_model(self):
        """ 保存GRU模型 """
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        torch.save(self.model.state_dict(), self.model_path)
        joblib.dump(self.scaler, self.scaler_path)

    def load_model(self):
        """ 加载GRU模型 """
        if not os.path.exists(self.model_path) or not os.path.exists(self.scaler_path):
            return False
        self.model = self._build_model()
        self.model.load_state_dict(torch.load(self.model_path, map_location=self.device))
        self.scaler = joblib.load(self.scaler_path)
        return True

class GRUModel(nn.Module):
    """
    GRU模型
    隐藏层数: 64
    堆叠层数: 2
    """
    def __init__(self, input_size, hidden_size=64, num_layers=2, output_size=1, dropout = 0.2):
        super().__init__()
        self.gru = nn.GRU(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout
        )
        self.fc = nn.Linear(hidden_size, output_size)

    def forward(self, x):
        x, _ = self.gru(x)
        x = self.fc(x[:, -1, :])
        return x

