# 水质预测平台
一个简易的水质预测平台

## 目前的功能
- 自动处理并从excel表格导入国控水质检测平台的水质数据
- 基本的前端，用户注册并登入后可以管理水质数据，查看历史趋势
- 后端可利用以往的水质数据训练模型，并预测下个月的水质（目前支持SVM/AdaBoost/LSTM/GRU/Bi-RNN）


## 技术栈
- 前端：Vue3+Vite
- 后端-用户管理模块：Kotlin+SpringBoot3+JPA
- 后端-模型管理模块：FastAPI+Pandas+Scikit-learn+Pytorch

```plaintext
WaterQuality/                  # 项目根目录
├── Database/                  # 数据库相关文件
├── Import/                    # 自动导入工具
├── Module-BackEnd-FastAPI/    # 后端-模型管理模块（FastAPI）
├── Module-BackEnd-KtSpring/   # 后端-用户管理模块（SpringBoot3）
└── Module-FrontEnd-Vue/       # 前端模块（Vue3）
```

## 简单体验
1. （可选）更改后端/导入工具的数据库用户名/密码/数据库名配置
2. 使用默认数据库凭据（用户名密码均为root）创建名为water的数据库，并导入`Database`下的表结构
3. pip安装相关依赖后，使用`Import`下的工具导入水质数据到数据库
4. 在`Module-FrontEnd-Vue`中启动前端
5. 在`Module-BackEnd-KtSpring`中启动用户管理模块
6. 在`Module-BackEnd-FastAPI`中启动模型管理模块
7. 登入`127.0.0.1:8081`，使用默认管理员账号（用户名admin，密码123）登入网站
8. ...

**注意**: **项目本身仅供学习**，若不进行多余的配置，**不建议直接用于生产环境**

## 系统架构流程图
![系统架构流程图](Flow.jpg)

## 特别感谢
@Jetbrains IDE开发支持

@sctpan 本项目部分引用其水质检测系统的代码