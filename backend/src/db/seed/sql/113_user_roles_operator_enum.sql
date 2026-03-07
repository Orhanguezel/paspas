ALTER TABLE `user_roles`
  MODIFY COLUMN `role`
  ENUM(
    'admin',
    'sevkiyatci',
    'operator',
    'satin_almaci',
    'moderator',
    'seller',
    'user'
  )
  NOT NULL DEFAULT 'user';
