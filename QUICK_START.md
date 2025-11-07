# 🚀 QUICK START - Deploy AromaSouQ Backend in 1 Hour

**Let's get your 176+ APIs live right now!**

---

## ⏱️ **Timeline**

- **Step 1-2**: Account setup (10 minutes)
- **Step 3**: MongoDB setup (10 minutes)
- **Step 4-9**: Deploy services (30 minutes)
- **Step 10**: Test everything (10 minutes)

**Total**: ~60 minutes to live backend! 🎉

---

## 📋 **Step 1: Create Railway Account** (3 minutes)

### **Do This Now:**

1. **Open**: https://railway.app
2. **Click**: "Start a New Project"
3. **Sign in with GitHub**
4. **Authorize** Railway to access your repos

✅ **Done?** You should see Railway dashboard

---

## 📋 **Step 2: Create MongoDB Atlas Account** (5 minutes)

### **Do This Now:**

1. **Open**: https://cloud.mongodb.com
2. **Sign up** for free account
3. **Verify** your email
4. **Login** to MongoDB Atlas

✅ **Done?** You should see "Create a Database" button

---

## 📋 **Step 3: Setup MongoDB Database** (10 minutes)

### **3.1 Create Cluster**

1. Click **"Build a Database"**
2. Choose **"M0 FREE"** tier (512MB - perfect for staging!)
3. **Provider**: AWS
4. **Region**: Select closest to you (or `us-east-1` if unsure)
5. **Cluster Name**: `aromasouq-cluster`
6. Click **"Create"**

⏳ Wait 1-3 minutes for cluster to provision...

### **3.2 Create Database User**

1. You'll see "Security Quickstart"
2. **Authentication Method**: Username/Password
3. **Username**: `aromasouq_admin`
4. **Password**: Click "Autogenerate Secure Password" → **COPY IT!** (save to notes)
5. Click **"Create User"**

### **3.3 Whitelist IP Address**

1. Click **"Add entries to your IP Access List"**
2. Click **"Allow Access from Anywhere"**
3. IP: `0.0.0.0/0` (auto-filled)
4. Click **"Add Entry"**

### **3.4 Get Connection String**

1. Click **"Finish and Close"**
2. Click **"Connect"**
3. Choose **"Connect your application"**
4. **Driver**: Node.js
5. **Version**: 5.5 or later
6. **Copy** the connection string:
   ```
   mongodb+srv://aromasouq_admin:<password>@aromasouq-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

7. **Replace `<password>`** with your actual password (from step 3.2)
8. **Add database name** to end:
   ```
   mongodb+srv://aromasouq_admin:YOUR_PASSWORD@aromasouq-cluster.xxxxx.mongodb.net/aromasouq_products?retryWrites=true&w=majority
   ```

9. **SAVE THIS STRING** - you'll need it soon!

✅ **Done?** You have MongoDB connection string saved

---

## 📋 **Step 4: Create Railway Project** (2 minutes)

### **Do This Now:**

1. In Railway dashboard, click **"+ New Project"**
2. Select **"Provision PostgreSQL"**
3. Wait for PostgreSQL to provision (~30 seconds)
4. Your project is created!

✅ **Done?** You should see PostgreSQL database in your project

---

## 📋 **Step 5: Create PostgreSQL Databases** (3 minutes)

### **5.1 Connect to PostgreSQL**

1. Click on **PostgreSQL** service
2. Go to **"Data"** tab
3. Click **"Connect"** → Opens terminal

### **5.2 Create 5 Databases**

Copy and paste this (one at a time):

```sql
CREATE DATABASE aromasouq_users;
CREATE DATABASE aromasouq_orders;
CREATE DATABASE aromasouq_payments;
CREATE DATABASE aromasouq_delivery;
CREATE DATABASE aromasouq_notifications;
```

Press Enter after each line.

### **5.3 Verify Databases Created**

```sql
\l
```

You should see all 5 databases listed!

✅ **Done?** All 5 databases created

---

## 📋 **Step 6: Deploy User Service** (5 minutes)

### **6.1 Add Service from GitHub**

1. In your Railway project, click **"+ New"**
2. Select **"GitHub Repo"**
3. Choose your repository: `imrejaul007/aromasouq`
4. **Root Directory**: `services/user-service`
5. Click **"Add Service"**

Railway will start building... (2-3 minutes first time)

### **6.2 Configure Environment Variables**

While it builds, click on the User Service → **"Variables"** tab

Click **"+ New Variable"** and add these:

**NODE_ENV**
```
production
```

**PORT**
```
3100
```

**JWT_SECRET** (generate a random 32+ character string)
```
your-super-secret-jwt-key-change-this-to-random-string-min-32-chars
```

**JWT_EXPIRES_IN**
```
7d
```

**CORS_ORIGIN**
```
*
```

### **6.3 Add Database URL**

1. Click **"+ New Variable"**
2. Click **"Add Reference"** tab
3. Select **PostgreSQL**
4. Variable: **DATABASE_URL**
5. This auto-adds the connection string

**IMPORTANT**: Edit DATABASE_URL:
- Click on `DATABASE_URL` variable
- **Add** `/aromasouq_users` to the end of the URL
- It should look like: `postgresql://postgres:xxx@xxx.railway.app:xxx/aromasouq_users`

### **6.4 Generate Public URL**

1. Go to **"Settings"** tab
2. Scroll to **"Networking"**
3. Click **"Generate Domain"**
4. You'll get: `user-service-production-xxxx.up.railway.app`
5. **COPY THIS URL** - save it!

### **6.5 Redeploy**

1. Go to **"Deployments"** tab
2. Click **"View Logs"** on latest deployment
3. Wait for deployment to complete (~2-3 minutes)
4. Look for: "Application is running on: http://[::]:3100"

✅ **Done?** User Service is live! Test it:
```bash
curl https://your-user-service-url.up.railway.app/health
```

---

## 📋 **Step 7: Deploy Product Service** (5 minutes)

Same process as Step 6, but different variables:

### **7.1 Add Service**
- Root Directory: `services/product-service`

### **7.2 Environment Variables**

**NODE_ENV**: `production`
**PORT**: `3200`
**CORS_ORIGIN**: `*`

**MONGODB_URI**: (paste your MongoDB connection string from Step 3.4)
```
mongodb+srv://aromasouq_admin:YOUR_PASSWORD@aromasouq-cluster.xxxxx.mongodb.net/aromasouq_products?retryWrites=true&w=majority
```

### **7.3 Generate Domain**
Save the URL!

✅ **Done?** Product Service is live!

---

## 📋 **Step 8: Deploy Order Service** (5 minutes)

### **8.1 Add Service**
- Root Directory: `services/order-service`

### **8.2 Environment Variables**

**NODE_ENV**: `production`
**PORT**: `3300`
**CORS_ORIGIN**: `*`

**DATABASE_URL**: (Reference PostgreSQL, add `/aromasouq_orders`)

**PRODUCT_SERVICE_URL**: `https://your-product-service-url.up.railway.app`

**USER_SERVICE_URL**: `https://your-user-service-url.up.railway.app`

### **8.3 Generate Domain**

✅ **Done?** Order Service is live!

---

## 📋 **Step 9: Deploy Remaining Services** (15 minutes)

**Deploy these 3 services using the same pattern:**

### **Payment Service**
- Root Directory: `services/payment-service`
- PORT: `3500`
- DATABASE_URL: Add `/aromasouq_payments`
- STRIPE_SECRET_KEY: `sk_test_xxx` (get from https://dashboard.stripe.com)

### **Delivery Service**
- Root Directory: `services/delivery-service`
- PORT: `3600`
- DATABASE_URL: Add `/aromasouq_delivery`

### **Notification Service**
- Root Directory: `services/notification-service`
- PORT: `3400`
- DATABASE_URL: Add `/aromasouq_notifications`

✅ **Done?** All 6 services are live!

---

## 📋 **Step 10: Test Everything** (10 minutes)

### **10.1 Save All URLs**

Create a file with your service URLs:

```
User Service: https://user-service-production-xxxx.up.railway.app
Product Service: https://product-service-production-xxxx.up.railway.app
Order Service: https://order-service-production-xxxx.up.railway.app
Payment Service: https://payment-service-production-xxxx.up.railway.app
Delivery Service: https://delivery-service-production-xxxx.up.railway.app
Notification Service: https://notification-service-production-xxxx.up.railway.app
```

### **10.2 Test Health Endpoints**

Test each service (replace with your actual URLs):

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

**Expected**: Each should return `200 OK` or `{"status":"ok"}`

### **10.3 Test AI Endpoints**

```bash
# Get trending products
curl https://your-product-service-url/api/products/ai/trending

# Smart search
curl -X POST https://your-product-service-url/api/products/ai/smart-search \
  -H "Content-Type: application/json" \
  -d '{"query":"oud rose","limit":10}'
```

✅ **Done?** All endpoints responding!

---

## 🎉 **SUCCESS! You're Live!**

**You now have:**
- ✅ 6 microservices running on Railway
- ✅ 176+ API endpoints accessible via HTTPS
- ✅ PostgreSQL database (5 databases inside)
- ✅ MongoDB database on Atlas
- ✅ All services with auto-deploy enabled
- ✅ SSL certificates (HTTPS) automatic
- ✅ Production-ready infrastructure!

---

## 💰 **What This Costs**

**Railway**: ~$5/month per service = ~$30-40/month
**MongoDB Atlas**: $0/month (M0 free tier)

**Total**: ~$30-40/month for staging

(Costs may increase with usage, but you get $5 free credit to start!)

---

## 🚀 **What's Next?**

### **Option 1: Seed Sample Data**
Add products to test with:
- Login to MongoDB Atlas
- Use "Collections" tab
- Insert sample products

### **Option 2: Start Frontend**
Now that backend is live, start building frontend:
```bash
cd /Users/rejaulkarim/Documents/AromaSouQ/aromasouq-platform
mkdir -p apps && cd apps
npx create-next-app@latest customer-web --typescript --tailwind --app
```

### **Option 3: Test All 176+ Endpoints**
Use Postman/Insomnia to test:
- User registration/login
- Product search with AI
- Order creation
- All 30 smart filters

---

## 📞 **Need Help?**

**If something fails:**
1. Check "Deployments" tab in Railway
2. Click "View Logs" to see errors
3. Verify environment variables are correct
4. Check DATABASE_URL has correct database name at end

**Common issues:**
- ❌ Build fails → Check Dockerfile exists
- ❌ Database connection fails → Verify DATABASE_URL
- ❌ 503 error → Service still deploying, wait 1-2 min
- ❌ CORS error → Add your frontend URL to CORS_ORIGIN

---

## ✅ **Deployment Checklist**

- [ ] Railway account created
- [ ] MongoDB Atlas account created
- [ ] MongoDB cluster created
- [ ] MongoDB user created
- [ ] MongoDB connection string saved
- [ ] Railway PostgreSQL added
- [ ] 5 PostgreSQL databases created
- [ ] User Service deployed ✅
- [ ] Product Service deployed ✅
- [ ] Order Service deployed ✅
- [ ] Payment Service deployed ✅
- [ ] Delivery Service deployed ✅
- [ ] Notification Service deployed ✅
- [ ] All health checks passing ✅
- [ ] Service URLs saved ✅
- [ ] Test endpoints working ✅

---

**Time to Complete**: ~60 minutes
**Status**: Backend LIVE! 🎉
**Next**: Frontend development or seed data

**You did it! Your $140,000 backend is now running in production!** 🚀

---

**Generated**: November 7, 2025
**Deployment Platform**: Railway + MongoDB Atlas
**Services**: 6 microservices + 2 databases
