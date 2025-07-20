from sklearn.ensemble import AdaBoostRegressor

from trainers.BaseTrainer import BaseTrainer


class AdaBoostTrainer(BaseTrainer):
    """
    AdaBoost实现
    https://blog.fxmarkbrown.top/article/108
    """
    def _build_model(self):
        """ 构建AdaBoost模型 """
        return AdaBoostRegressor(n_estimators=100, random_state=42)