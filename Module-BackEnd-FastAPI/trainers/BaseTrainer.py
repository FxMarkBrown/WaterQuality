import os
from abc import ABC, abstractmethod

import joblib
import numpy as np
from sklearn.metrics import mean_squared_error
from sklearn.model_selection import train_test_split


class BaseTrainer(ABC):
    def __init__(self, model_id, target_name, scaler=None):
        self.model_id = model_id
        self.target_name = target_name
        self.model = None
        self.scaler = scaler
        self.model_path = f"cached_models/model_{model_id}.joblib"
        self.scaler_path = f"cached_models/scaler_{model_id}.joblib"

# private
    @abstractmethod
    def _build_model(self):
        """
        构建模型
        """
        pass

    def _save_model(self):
        """ 保存模型 """
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        joblib.dump(self.model, self.model_path)
        joblib.dump(self.scaler, self.scaler_path)
# public
    def train(self, X, y):
        """
        训练模型
        :param X: 特征向量
        :param y: 真实标签
        :return:
        """
        # 划分训练集和测试集
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        # 训练模型
        self.model = self._build_model()
        self.model.fit(X_train, y_train)

        # 评估模型
        y_pred = self.predict(X_test)
        rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))

        # 保存模型
        self._save_model()
        return rmse, X_test, y_test, y_pred

    def predict(self, X):
        """
        预测接口
        :param X: 待预测数据
        """
        return self.model.predict(X)

    def load_model(self):
        """
        加载模型
        """
        if not os.path.exists(self.model_path) or not os.path.exists(self.scaler_path):
            return False
        self.model = joblib.load(self.model_path)
        self.scaler = joblib.load(self.scaler_path)
        return True