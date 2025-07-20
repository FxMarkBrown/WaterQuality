SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `model`;
CREATE TABLE `model`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `target` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `method` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL,
  `rmse` float NULL DEFAULT NULL,
  `uid` int(11) NOT NULL,
  `date` datetime NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `model_user_id_fk`(`uid`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 7 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci ROW_FORMAT = DYNAMIC;

DROP TABLE IF EXISTS `role`;
CREATE TABLE `role`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 5 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci ROW_FORMAT = DYNAMIC;

INSERT INTO `role` VALUES (1, 'ADMIN');
INSERT INTO `role` VALUES (2, 'VIP');
INSERT INTO `role` VALUES (3, 'USER');

DROP TABLE IF EXISTS `user`;
CREATE TABLE `user`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `pass` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `rid` int(11) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `FK8079530ngl61ed971pmagese0`(`rid`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 5 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci ROW_FORMAT = DYNAMIC;

INSERT INTO `user` VALUES (1, 'admin', '$2a$10$4C0N8Lk24ypMB/oKjeHavuGCGOghyXapnvC2U4uETY3LvXGFWUzma', 1);

DROP TABLE IF EXISTS `waterquality`;
CREATE TABLE `waterquality`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `PH` float NULL DEFAULT NULL,
  `DO` float NULL DEFAULT NULL,
  `NH3N` float NULL DEFAULT NULL,
  `date` datetime NOT NULL,
  `station` int(11) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `waterquality_id_uindex`(`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 895 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci ROW_FORMAT = FIXED;

SET FOREIGN_KEY_CHECKS = 1;
