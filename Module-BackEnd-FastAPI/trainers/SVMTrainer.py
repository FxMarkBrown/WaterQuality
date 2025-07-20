from sklearn.svm import SVR

from trainers.BaseTrainer import BaseTrainer


class SVMTrainer(BaseTrainer):
    """
    SVM实现
    https://blog.fxmarkbrown.top/article/95 及 https://blog.fxmarkbrown.top/article/106
    """
    def _build_model(self):
        """ 构建SVM模型 """
        return SVR(kernel='rbf', C=100, gamma=0.1)