# Railway Deployment Guide - AromaSouQ Platform

**Time to Deploy**: 1-2 hours
**Cost**: ~$150-200/month
**Difficulty**: Easy (beginner-friendly)

---

## 🚀 **Why Railway?**

✅ **Fastest deployment** - 1-hour setup vs. days on AWS
✅ **Automatic SSL** - HTTPS out of the box
✅ **Easy database setup** - PostgreSQL & MongoDB with one click
✅ **GitHub integration** - Auto-deploy on push
✅ **Environment variables** - Simple UI management
✅ **Built-in monitoring** - Logs and metrics included
✅ **No DevOps required** - Perfect for solo developers

---

## 📋 **Prerequisites**

- [x] Backend code pushed to GitHub ✅ (Done!)
- [ ] Railway account (sign up: https://railway.app)
- [ ] MongoDB Atlas account (free tier: https://cloud.mongodb.com)
- [ ] Credit card for Railway (free $5 trial, then pay-as-you-go)

---

## 🎯 **Step-by-Step Deployment**

### **Step 1: Create Railway Account** (5 minutes)

1. Go to https://railway.app
2. Click "Start a New Project"
3. Sign in with GitHub
4. Authorize Railway to access your repositories

---

### **Step 2: Setup MongoDB Atlas** (10 minutes)

Railway doesn't offer MongoDB, so we'll use MongoDB Atlas (free tier available):

1. **Create MongoDB Atlas Account**
   - Go to https://cloud.mongodb.com
   - Sign up for free account
   - Verify email

2. **Create Cluster**
   - Click "Build a Database"
   - Choose **M0 FREE tier** (512MB storage, perfect for staging)
   - Select region closest to your Railway deployment (US East recommended)
   - Cluster name: `aromasouq-cluster`

3. **Create Database User**
   - Username: `aromasouq_admin`
   - Password: Generate strong password (save it!)
   - Click "Create User"

4. **Whitelist IP Addresses**
   - Click "Network Access"
   - Click "Add IP Address"
   - Select **"Allow Access from Anywhere"** (0.0.0.0/0)
   - Click "Confirm"

5. **Get Connection String**
   - Click "Database" → "Connect"
   - Choose "Connect your application"
   - Copy connection string:
     ```
     mongodb+srv://aromasouq_admin:<password>@aromasouq-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your actual password
   - Save this for later!

---

### **Step 3: Create Railway Project** (5 minutes)

1. **Create New Project**
   - In Railway dashboard, click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository: `imrejaul007/aromasouq`
   - Railway will detect your services automatically!

2. **Project Structure**
   Railway will create a project. You'll add services manually.

---

### **Step 4: Add PostgreSQL Database** (2 minutes)

1. In your Railway project, click **"+ New"**
2. Select **"Database"**
3. Choose **"PostgreSQL"**
4. Railway will provision a PostgreSQL instance automatically
5. Note: This one database will be used by 5 services (we'll create separate databases inside it)

---

### **Step 5: Deploy User Service** (15 minutes)

1. **Add User Service**
   - Click **"+ New"** → **"GitHub Repo"**
   - Select your `aromasouq` repository
   - Railway will ask for root directory
   - Set root directory: `services/user-service`
   - Click "Deploy"

2. **Configure Environment Variables**
   - Click on the User Service
   - Go to **"Variables"** tab
   - Add these variables:

   ```env
   NODE_ENV=production
   PORT=3100

   # Database (Railway provides this automatically, but we need to modify it)
   # Click "Connect" on PostgreSQL, copy DATABASE_URL
   # Then modify it to add database name:
   DATABASE_URL=postgresql://user:pass@host:port/aromasouq_users

   # JWT
   JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long-random-string
   JWT_EXPIRES_IN=7d

   # CORS (we'll update this after deployment)
   CORS_ORIGIN=*
   ```

3. **Reference PostgreSQL Database**
   - In Variables tab, click **"+ New Variable"**
   - Click **"Add Reference"**
   - Select your PostgreSQL database
   - This will auto-add `DATABASE_URL`
   - **Important**: Edit it to add `/aromasouq_users` at the end

4. **Create Database**
   - Go to PostgreSQL service → **"Data"** tab
   - Click **"Connect"** → Opens psql terminal
   - Run:
     ```sql
     CREATE DATABASE aromasouq_users;
     ```

5. **Trigger Deployment**
   - Go back to User Service
   - Click **"Settings"** → **"Redeploy"**
   - Railway will build and deploy (5-10 minutes first time)

6. **Get Service URL**
   - Once deployed, click **"Settings"**
   - Under **"Domains"**, click **"Generate Domain"**
   - You'll get: `user-service-production-xxxx.up.railway.app`
   - Save this URL!

---

### **Step 6: Deploy Product Service** (15 minutes)

1. **Add Product Service**
   - Click **"+ New"** → **"GitHub Repo"**
   - Root directory: `services/product-service`
   - Click "Deploy"

2. **Configure Environment Variables**
   ```env
   NODE_ENV=production
   PORT=3200

   # MongoDB (from Atlas - Step 2)
   MONGODB_URI=mongodb+srv://aromasouq_admin:YOUR_PASSWORD@aromasouq-cluster.xxxxx.mongodb.net/aromasouq_products?retryWrites=true&w=majority

   # Elasticsearch (optional for now, can add later)
   # ELASTICSEARCH_NODE=https://your-es-url

   CORS_ORIGIN=*
   ```

3. **Generate Domain**
   - Settings → Domains → Generate Domain
   - Save URL: `product-service-production-xxxx.up.railway.app`

---

### **Step 7: Deploy Order Service** (10 minutes)

1. **Create Order Database**
   ```sql
   CREATE DATABASE aromasouq_orders;
   ```

2. **Add Order Service**
   - Root directory: `services/order-service`
   - Environment variables:
     ```env
     NODE_ENV=production
     PORT=3300
     DATABASE_URL=postgresql://user:pass@host:port/aromasouq_orders

     # Service URLs (from Step 5 & 6)
     PRODUCT_SERVICE_URL=https://product-service-production-xxxx.up.railway.app
     USER_SERVICE_URL=https://user-service-production-xxxx.up.railway.app

     CORS_ORIGIN=*
     ```

3. **Generate Domain** and save URL

---

### **Step 8: Deploy Payment Service** (10 minutes)

1. **Create Payment Database**
   ```sql
   CREATE DATABASE aromasouq_payments;
   ```

2. **Add Payment Service**
   - Root directory: `services/payment-service`
   - Environment variables:
     ```env
     NODE_ENV=production
     PORT=3500
     DATABASE_URL=postgresql://user:pass@host:port/aromasouq_payments

     # Stripe (get from https://dashboard.stripe.com)
     STRIPE_SECRET_KEY=sk_test_your_test_key_here
     STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

     CORS_ORIGIN=*
     ```

3. **Get Stripe Keys**
   - Go to https://dashboard.stripe.com
   - Sign up/login
   - Get test keys from Developers → API keys
   - Use **test keys** for staging

4. **Generate Domain** and save URL

---

### **Step 9: Deploy Delivery Service** (10 minutes)

1. **Create Delivery Database**
   ```sql
   CREATE DATABASE aromasouq_delivery;
   ```

2. **Add Delivery Service**
   - Root directory: `services/delivery-service`
   - Environment variables:
     ```env
     NODE_ENV=production
     PORT=3600
     DATABASE_URL=postgresql://user:pass@host:port/aromasouq_delivery

     CORS_ORIGIN=*
     ```

3. **Generate Domain** and save URL

---

### **Step 10: Deploy Notification Service** (10 minutes)

1. **Create Notification Database**
   ```sql
   CREATE DATABASE aromasouq_notifications;
   ```

2. **Add Notification Service**
   - Root directory: `services/notification-service`
   - Environment variables:
     ```env
     NODE_ENV=production
     PORT=3400
     DATABASE_URL=postgresql://user:pass@host:port/aromasouq_notifications

     # Email (optional for staging, can use console logging)
     # SENDGRID_API_KEY=SG.xxx

     # SMS (optional)
     # TWILIO_ACCOUNT_SID=ACxxx
     # TWILIO_AUTH_TOKEN=xxx

     CORS_ORIGIN=*
     ```

3. **Generate Domain** and save URL

---

### **Step 11: Test All Services** (10 minutes)

Test each service health endpoint:

```bash
# User Service
curl https://user-service-production-xxxx.up.railway.app/health

# Product Service
curl https://product-service-production-xxxx.up.railway.app/health

# Order Service
curl https://order-service-production-xxxx.up.railway.app/health

# Payment Service
curl https://payment-service-production-xxxx.up.railway.app/health

# Delivery Service
curl https://delivery-service-production-xxxx.up.railway.app/health

# Notification Service
curl https://notification-service-production-xxxx.up.railway.app/health
```

**Expected Response**: `200 OK` or `{"status":"ok"}`

---

### **Step 12: Test API Endpoints** (10 minutes)

Test key endpoints:

```bash
# Get trending products
curl https://product-service-production-xxxx.up.railway.app/api/products/ai/trending

# Search products
curl -X POST https://product-service-production-xxxx.up.railway.app/api/products/ai/smart-search \
  -H "Content-Type: application/json" \
  -d '{"query":"oud","limit":10}'

# Register user (optional)
curl -X POST https://user-service-production-xxxx.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}'
```

---

## 📊 **Your Deployed Services**

After completion, you'll have:

| Service | URL | Status |
|---------|-----|--------|
| **User Service** | `https://user-service-production-xxxx.up.railway.app` | ✅ Live |
| **Product Service** | `https://product-service-production-xxxx.up.railway.app` | ✅ Live |
| **Order Service** | `https://order-service-production-xxxx.up.railway.app` | ✅ Live |
| **Payment Service** | `https://payment-service-production-xxxx.up.railway.app` | ✅ Live |
| **Delivery Service** | `https://delivery-service-production-xxxx.up.railway.app` | ✅ Live |
| **Notification Service** | `https://notification-service-production-xxxx.up.railway.app` | ✅ Live |
| **PostgreSQL** | Internal | ✅ Live |
| **MongoDB Atlas** | External | ✅ Live |

---

## 💰 **Cost Breakdown**

### **Railway** (~$150/month)
- PostgreSQL database: $10/month
- 6 services × $20/month each: $120/month
- Bandwidth: ~$20/month
- **Total**: ~$150/month

### **MongoDB Atlas** ($0-60/month)
- M0 Free tier: $0/month (512MB) ✅ Start here
- M10 tier: $60/month (10GB) - Upgrade when needed

### **Total Monthly Cost**: **$150-210/month**

**Note**: Railway gives $5 free credit for new accounts to test!

---

## 🎯 **Next Steps After Deployment**

### **1. Save All Service URLs** (5 minutes)

Create a file `DEPLOYED_SERVICES.md`:
```markdown
# Deployed Service URLs

- User Service: https://user-service-production-xxxx.up.railway.app
- Product Service: https://product-service-production-xxxx.up.railway.app
- Order Service: https://order-service-production-xxxx.up.railway.app
- Payment Service: https://payment-service-production-xxxx.up.railway.app
- Delivery Service: https://delivery-service-production-xxxx.up.railway.app
- Notification Service: https://notification-service-production-xxxx.up.railway.app
```

### **2. Update CORS Origins** (Optional)

Once you have your frontend domain:
```env
CORS_ORIGIN=https://aromasouq.com,https://www.aromasouq.com
```

### **3. Seed Sample Data** (Optional)

Add some sample products for testing:
- Login to Railway
- Go to Product Service → Terminal
- Run seed script if you have one

### **4. Setup Monitoring**

Railway provides built-in monitoring:
- Click on each service → **"Metrics"**
- View CPU, memory, requests
- View logs in real-time

---

## 🐛 **Troubleshooting**

### **Service Won't Deploy**
- Check **"Deployments"** tab for build logs
- Look for errors in build process
- Verify Dockerfile is correct
- Check environment variables

### **Database Connection Fails**
- Verify `DATABASE_URL` is correct
- Ensure database exists (CREATE DATABASE)
- Check if migrations ran (look at logs)

### **Health Check Fails**
- Ensure your app has a `/health` endpoint
- Check if service is listening on correct PORT
- View logs for errors

### **CORS Errors**
- Set `CORS_ORIGIN=*` for testing
- Update to specific domains for production

---

## 📚 **Useful Railway Commands**

```bash
# Install Railway CLI (optional)
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# View logs
railway logs

# Run command
railway run npm run migrate

# Deploy
railway up
```

---

## ✅ **Deployment Checklist**

- [ ] Railway account created
- [ ] MongoDB Atlas cluster created
- [ ] PostgreSQL database added to Railway
- [ ] 5 PostgreSQL databases created
- [ ] User Service deployed and healthy
- [ ] Product Service deployed and healthy
- [ ] Order Service deployed and healthy
- [ ] Payment Service deployed and healthy
- [ ] Delivery Service deployed and healthy
- [ ] Notification Service deployed and healthy
- [ ] All service URLs saved
- [ ] Test API endpoints working
- [ ] Monitoring setup reviewed

---

## 🎉 **Success!**

Once all services show ✅ healthy status, you have:

**176+ API endpoints live and accessible via HTTPS!**

You can now:
1. ✅ Start frontend development with real APIs
2. ✅ Test all features end-to-end
3. ✅ Share staging URLs with team/stakeholders
4. ✅ Begin integration testing

---

## 📞 **Support**

**Railway Issues**:
- Documentation: https://docs.railway.app
- Discord: https://discord.gg/railway
- Support: help@railway.app

**MongoDB Atlas Issues**:
- Documentation: https://docs.atlas.mongodb.com
- Support: https://support.mongodb.com

---

**Deployment Time**: 1-2 hours
**Status**: Ready to deploy! 🚀
**Next**: Frontend development with live APIs

---

**Generated**: November 7, 2025
**Platform**: Railway + MongoDB Atlas
**Services**: 6 microservices + 2 databases
