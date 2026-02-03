## 项目简介

FB Ad Spy 是一个基于 Facebook Ads Library API 的广告创意监控与灵感工具，支持：

- 🔍 **关键词搜索** - 按关键词发现行业广告
- 👁️ **竞品监控** - 追踪指定 Facebook Page 的广告动态
- 💾 **创意收藏** - 保存感兴趣的广告素材和文案
- 📁 **收藏夹管理** - 用收藏夹和标签整理广告
- 👥 **多用户支持** - 每个用户有独立的数据空间

## 快速开始

### 前置要求

- Node.js 20+
- pnpm 8+
- Docker & Docker Compose
- Facebook Developer 账号和 Access Token

### 1. 克隆项目

```bash
git clone https://github.com/wonglamho/FB-Ad-Spy.git
cd FB-Ad-Spy
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的配置：

```plain
# 必填
FACEBOOK_ACCESS_TOKEN=your_token_here
JWT_SECRET=your_jwt_secret_at_least_32_chars

# 可选（使用默认值）
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fb_ad_spy
REDIS_URL=redis://localhost:6379
```

### 4. 启动开发环境

```bash
# 启动数据库和 Redis
make dev-db

# 初始化数据库
pnpm run db:push

# 启动开发服务器
pnpm run dev
```

访问 <http://localhost:5173> 即可使用。

## 生产环境部署

### 1. 准备 VPS

推荐配置：

- CPU: 2 核+
- 内存: 4GB+
- 存储: 40GB+ SSD
- 系统: Ubuntu 22.04 LTS

安装 Docker：

```bash
# 安装 Docker
curl -fsSL https://get.docker.com | sh

# 安装 Docker Compose
sudo apt install docker-compose-plugin

# 将当前用户加入 docker 组
sudo usermod -aG docker $USER
```

### 2. 拉取代码

```bash
# 在本地
git clone https://github.com/wonglamho/FB-Ad-Spy.git
cd FB-Ad-Spy
```

### 3. 配置环境变量

```bash
# 在服务器上
cp .env.production.example .env
vim .env  # 编辑配置
```

**重要配置项：**

```plain
# 生成强密码
POSTGRES_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)

# Facebook API
FACEBOOK_ACCESS_TOKEN=your_long_lived_token

# 你的域名
CORS_ORIGIN=https://adspy.yourdomain.com
```

### 4. 构建并启动

```bash
# 构建镜像
docker compose build

# 启动服务
docker compose up -d

# 查看日志
docker compose logs -f
```

### 5. 配置 HTTPS（推荐）

使用 Nginx + Let's Encrypt：

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d adspy.yourdomain.com
```

Nginx 配置示例 ( `/etc/nginx/sites-available/fb-ad-spy`)：

```nginx
server {
    listen 80;
    server_name adspy.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name adspy.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/adspy.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/adspy.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 使用指南

### 搜索广告

1. 进入"搜索广告"页面
2. 输入关键词（如 "skincare", "fitness"）或 Page ID
3. 选择目标国家/地区
4. 使用高级筛选缩小范围
5. 点击搜索

### 添加竞品监控

1. 进入"竞品监控"页面
2. 点击"添加监控"
3. 输入竞品的 Facebook Page ID
4. 系统会自动定时获取该主页的最新广告

**如何获取 Page ID：**

- 访问目标 Facebook 主页
- 点击"关于"标签
- 在"页面透明度"部分可以找到 Page ID
- 或者使用 [Find Facebook ID](https://findmyfbid.in/) 工具

### 保存广告

1. 在搜索结果或监控详情中找到感兴趣的广告
2. 点击书签图标
3. 选择收藏夹（可选）
4. 添加备注和标签（可选）
5. 点击保存

### 管理收藏夹

1. 进入"收藏夹"页面
2. 创建不同主题的收藏夹（如"电商广告"、"视频创意"）
3. 在保存广告时选择对应收藏夹
4. 使用标签进一步分类

## 常见问题

### Q: 搜索返回空结果？

可能原因：

1. 关键词拼写错误或语言不匹配（API 不翻译关键词）
2. 选择的国家没有相关广告
3. 日期范围设置不当
4. Access Token 过期

### Q: 如何刷新 Access Token？

短期 Token 有效期约 1-2 小时，建议使用长期 Token：

```bash
curl -X GET "https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id={APP_ID}&client_secret={APP_SECRET}&fb_exchange_token={SHORT_TOKEN}"
```

### Q: 遇到 Rate Limit 错误？

Facebook API 有调用频率限制。解决方案：

1. 减少搜索频率
2. 系统已内置 Redis 缓存，重复搜索会使用缓存
3. 如果是生产环境，考虑申请更高的 API 配额

### Q: 如何备份数据？

```bash
# 备份数据库
docker compose exec postgres pg_dump -U postgres fb_ad_spy > backup.sql

# 恢复数据库
cat backup.sql | docker compose exec -T postgres psql -U postgres fb_ad_spy
```

## 技术架构

```plain
┌─────────────────────────────────────────────────────────────┐
│                         Nginx (HTTPS)                        │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│     Frontend (React)     │     │    Backend (Express)    │
│     - Vite + TS          │     │    - TypeScript         │
│     - TailwindCSS        │◄───►│    - Prisma ORM         │
│     - React Query        │     │    - JWT Auth           │
└─────────────────────────┘     └─────────────────────────┘
                                              │
                              ┌───────────────┴───────────────┐
                              ▼                               ▼
                    ┌─────────────────┐           ┌─────────────────┐
                    │   PostgreSQL    │           │      Redis      │
                    │   (数据存储)     │           │   (API 缓存)    │
                    └─────────────────┘           └─────────────────┘
                                              │
                                              ▼
                                   ┌─────────────────────┐
                                   │  Facebook Ads API   │
                                   └─────────────────────┘
```

## 开发指南

### 项目结构

```plain
fb-ad-spy/
├── packages/
│   ├── server/         # 后端服务
│   ├── web/            # 前端应用
│   └── shared/         # 共享类型
├── docker-compose.yml  # 生产部署
└── docker-compose.dev.yml  # 开发环境
```

### 常用命令

```bash
# 开发
pnpm run dev          # 启动所有服务
pnpm --filter server run dev  # 只启动后端
pnpm --filter web run dev     # 只启动前端

# 数据库
pnpm run db:generate  # 生成 Prisma Client
pnpm run db:push      # 同步数据库结构
pnpm run db:migrate   # 运行迁移

# 构建
pnpm run build        # 构建所有包

# Docker
make up               # 启动生产环境
make down             # 停止服务
make logs             # 查看日志
```

## License

MIT
