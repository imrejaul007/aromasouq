# AromaSouQ Platform - Deployment & Production Guide

## Overview

This guide covers deploying the AromaSouQ multi-vendor fragrance marketplace to production using AWS, Kubernetes, and modern DevOps practices.

---

## Architecture Overview

### Microservices (6 services)

1. **User Service** (Port 3100) - Authentication, profiles, wallets
2. **Product Service** (Port 3200) - Product catalog, search, reviews
3. **Order Service** (Port 3300) - Order management, multi-vendor splitting
4. **Payment Service** (Port 3500) - Payment processing, refunds
5. **Delivery Service** (Port 3600) - Shipment tracking, courier integration
6. **Notification Service** (Port 3400) - Email, SMS, push notifications

### Infrastructure Components

- **API Gateway**: Kong (centralized routing, rate limiting, authentication)
- **Message Queue**: Apache Kafka (event streaming between services)
- **Cache**: Redis (session management, caching)
- **Search**: Elasticsearch (product search)
- **Vector DB**: Qdrant (AI-powered scent matching)
- **Object Storage**: AWS S3 / MinIO (images, documents)
- **Databases**: PostgreSQL (5 services), MongoDB (Product Service)
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **CI/CD**: GitHub Actions

---

## Production Infrastructure (AWS)

### Recommended AWS Services

| Component | AWS Service | Purpose |
|-----------|-------------|---------|
| Container Orchestration | EKS (Elastic Kubernetes Service) | Run microservices |
| Database - PostgreSQL | RDS PostgreSQL Multi-AZ | User, Order, Payment, Delivery, Notification |
| Database - MongoDB | DocumentDB | Product Service |
| Cache | ElastiCache (Redis) | Session storage, caching |
| Search | OpenSearch Service | Product search |
| Message Queue | MSK (Managed Kafka) | Event streaming |
| Object Storage | S3 | Product images, documents |
| CDN | CloudFront | Static asset delivery |
| Load Balancer | ALB (Application Load Balancer) | Traffic distribution |
| DNS | Route 53 | Domain management |
| Email | SES (Simple Email Service) | Transactional emails |
| SMS | SNS | SMS notifications |
| Monitoring | CloudWatch + Prometheus | Metrics and alerts |
| Secrets | Secrets Manager | API keys, credentials |

### Estimated Monthly Costs (Production)

**Compute (EKS + EC2)**:
- EKS Cluster: $73/month
- 3x t3.medium nodes: $75/month
- Total: ~$150/month

**Databases**:
- RDS PostgreSQL (db.t3.medium Multi-AZ): $130/month
- DocumentDB (db.t3.medium): $100/month
- ElastiCache Redis (cache.t3.small): $35/month
- Total: ~$265/month

**Storage & CDN**:
- S3 (100GB storage, 1TB transfer): $25/month
- CloudFront (1TB transfer): $85/month
- Total: ~$110/month

**Other Services**:
- MSK (Kafka 2 brokers): $250/month
- OpenSearch (t3.small.search): $60/month
- SES (50k emails): $5/month
- SNS (10k SMS): $50/month
- Route 53: $0.50/month
- Total: ~$365/month

**Grand Total**: ~$890-1,000/month

*For high-traffic production, costs scale to $2,000-5,000/month*

---

## Kubernetes Deployment

### 1. Cluster Setup

```bash
# Create EKS cluster (AWS)
eksctl create cluster \
  --name aromasouq-production \
  --region me-south-1 \
  --node-type t3.medium \
  --nodes 3 \
  --nodes-min 2 \
  --nodes-max 6 \
  --managed

# Configure kubectl
aws eks update-kubeconfig \
  --region me-south-1 \
  --name aromasouq-production
```

### 2. Namespace Setup

```yaml
# k8s/namespaces.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: aromasouq-production
---
apiVersion: v1
kind: Namespace
metadata:
  name: aromasouq-staging
```

```bash
kubectl apply -f k8s/namespaces.yaml
```

### 3. Secrets Management

```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: database-secrets
  namespace: aromasouq-production
type: Opaque
stringData:
  POSTGRES_USER: aromasouq_user
  POSTGRES_PASSWORD: <strong-password>
  MONGODB_URI: <mongodb-connection-string>
  REDIS_PASSWORD: <redis-password>
---
apiVersion: v1
kind: Secret
metadata:
  name: payment-secrets
  namespace: aromasouq-production
type: Opaque
stringData:
  STRIPE_SECRET_KEY: <stripe-secret>
  TELR_API_KEY: <telr-api-key>
  PAYTABS_SECRET: <paytabs-secret>
---
apiVersion: v1
kind: Secret
metadata:
  name: notification-secrets
  namespace: aromasouq-production
type: Opaque
stringData:
  SENDGRID_API_KEY: <sendgrid-key>
  TWILIO_AUTH_TOKEN: <twilio-token>
  FIREBASE_PRIVATE_KEY: <firebase-key>
```

```bash
kubectl apply -f k8s/secrets.yaml
```

### 4. ConfigMaps

```yaml
# k8s/configmaps.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: service-config
  namespace: aromasouq-production
data:
  NODE_ENV: "production"
  CORS_ORIGIN: "https://aromasouq.com,https://www.aromasouq.com"
  JWT_EXPIRY: "7d"
  REDIS_HOST: "redis-service"
  REDIS_PORT: "6379"
  KAFKA_BROKERS: "kafka-service:9092"
  ELASTICSEARCH_URL: "http://elasticsearch-service:9200"
```

```bash
kubectl apply -f k8s/configmaps.yaml
```

### 5. Service Deployments

#### User Service

```yaml
# k8s/user-service.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
  namespace: aromasouq-production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
    spec:
      containers:
      - name: user-service
        image: aromasouq/user-service:latest
        ports:
        - containerPort: 3100
        env:
        - name: DATABASE_URL
          value: "postgresql://$(POSTGRES_USER):$(POSTGRES_PASSWORD)@rds-endpoint:5432/aromasouq_users"
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: jwt-secrets
              key: JWT_SECRET
        - name: REDIS_HOST
          valueFrom:
            configMapKeyRef:
              name: service-config
              key: REDIS_HOST
        envFrom:
        - configMapRef:
            name: service-config
        - secretRef:
            name: database-secrets
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3100
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3100
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: user-service
  namespace: aromasouq-production
spec:
  selector:
    app: user-service
  ports:
  - protocol: TCP
    port: 3100
    targetPort: 3100
  type: ClusterIP
```

#### Product Service

```yaml
# k8s/product-service.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: product-service
  namespace: aromasouq-production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: product-service
  template:
    metadata:
      labels:
        app: product-service
    spec:
      containers:
      - name: product-service
        image: aromasouq/product-service:latest
        ports:
        - containerPort: 3200
        env:
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: database-secrets
              key: MONGODB_URI
        - name: ELASTICSEARCH_URL
          valueFrom:
            configMapKeyRef:
              name: service-config
              key: ELASTICSEARCH_URL
        envFrom:
        - configMapRef:
            name: service-config
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
---
apiVersion: v1
kind: Service
metadata:
  name: product-service
  namespace: aromasouq-production
spec:
  selector:
    app: product-service
  ports:
  - protocol: TCP
    port: 3200
    targetPort: 3200
  type: ClusterIP
```

#### Order Service

```yaml
# k8s/order-service.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
  namespace: aromasouq-production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: order-service
  template:
    metadata:
      labels:
        app: order-service
    spec:
      containers:
      - name: order-service
        image: aromasouq/order-service:latest
        ports:
        - containerPort: 3300
        env:
        - name: DATABASE_URL
          value: "postgresql://$(POSTGRES_USER):$(POSTGRES_PASSWORD)@rds-endpoint:5432/aromasouq_orders"
        envFrom:
        - configMapRef:
            name: service-config
        - secretRef:
            name: database-secrets
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: order-service
  namespace: aromasouq-production
spec:
  selector:
    app: order-service
  ports:
  - protocol: TCP
    port: 3300
    targetPort: 3300
  type: ClusterIP
```

### 6. Ingress (API Gateway)

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: aromasouq-ingress
  namespace: aromasouq-production
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - api.aromasouq.com
    secretName: aromasouq-tls
  rules:
  - host: api.aromasouq.com
    http:
      paths:
      - path: /api/users
        pathType: Prefix
        backend:
          service:
            name: user-service
            port:
              number: 3100
      - path: /api/products
        pathType: Prefix
        backend:
          service:
            name: product-service
            port:
              number: 3200
      - path: /api/orders
        pathType: Prefix
        backend:
          service:
            name: order-service
            port:
              number: 3300
      - path: /api/payments
        pathType: Prefix
        backend:
          service:
            name: payment-service
            port:
              number: 3500
      - path: /api/shipments
        pathType: Prefix
        backend:
          service:
            name: delivery-service
            port:
              number: 3600
      - path: /api/notifications
        pathType: Prefix
        backend:
          service:
            name: notification-service
            port:
              number: 3400
```

### 7. Horizontal Pod Autoscaling

```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: user-service-hpa
  namespace: aromasouq-production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: user-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: product-service-hpa
  namespace: aromasouq-production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: product-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

## CI/CD Pipeline (GitHub Actions)

### 1. Build & Test Workflow

```yaml
# .github/workflows/build-test.yml
name: Build and Test

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test-user-service:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: |
        cd services/user-service
        npm ci

    - name: Run tests
      run: |
        cd services/user-service
        npm run test

    - name: Build
      run: |
        cd services/user-service
        npm run build

  test-product-service:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'

    - name: Install dependencies
      run: |
        cd services/product-service
        npm ci

    - name: Run tests
      run: |
        cd services/product-service
        npm run test

    - name: Build
      run: |
        cd services/product-service
        npm run build
```

### 2. Docker Build & Push Workflow

```yaml
# .github/workflows/docker-build.yml
name: Docker Build and Push

on:
  push:
    branches: [ main ]
    tags: [ 'v*' ]

env:
  REGISTRY: ghcr.io
  IMAGE_PREFIX: aromasouq

jobs:
  build-user-service:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
    - uses: actions/checkout@v3

    - name: Log in to Container Registry
      uses: docker/login-action@v2
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}

    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v4
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/user-service
        tags: |
          type=ref,event=branch
          type=semver,pattern={{version}}
          type=sha

    - name: Build and push
      uses: docker/build-push-action@v4
      with:
        context: ./services/user-service
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}

  build-product-service:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
    - uses: actions/checkout@v3

    - name: Log in to Container Registry
      uses: docker/login-action@v2
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}

    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v4
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/product-service

    - name: Build and push
      uses: docker/build-push-action@v4
      with:
        context: ./services/product-service
        push: true
        tags: ${{ steps.meta.outputs.tags }}
```

### 3. Deploy to Production Workflow

```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  push:
    tags:
      - 'v*'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3

    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: me-south-1

    - name: Update kubeconfig
      run: |
        aws eks update-kubeconfig \
          --region me-south-1 \
          --name aromasouq-production

    - name: Deploy User Service
      run: |
        kubectl set image deployment/user-service \
          user-service=${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/user-service:${{ github.ref_name }} \
          -n aromasouq-production
        kubectl rollout status deployment/user-service -n aromasouq-production

    - name: Deploy Product Service
      run: |
        kubectl set image deployment/product-service \
          product-service=${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/product-service:${{ github.ref_name }} \
          -n aromasouq-production
        kubectl rollout status deployment/product-service -n aromasouq-production

    - name: Deploy all services
      run: |
        kubectl apply -f k8s/ -n aromasouq-production
```

---

## Database Migration Strategy

### 1. Prisma Migrations (PostgreSQL)

```bash
# Generate migration
cd services/user-service
npx prisma migrate dev --name add_loyalty_points

# Deploy to production
npx prisma migrate deploy
```

### 2. MongoDB Migrations

```bash
# Use custom migration scripts
cd services/product-service
npm run migrate:up
```

### 3. Zero-Downtime Migrations

```yaml
# k8s/migration-job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: user-service-migration
  namespace: aromasouq-production
spec:
  template:
    spec:
      containers:
      - name: migration
        image: aromasouq/user-service:latest
        command: ["npx", "prisma", "migrate", "deploy"]
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-secrets
              key: USER_SERVICE_DB_URL
      restartPolicy: OnFailure
```

---

## Monitoring & Logging

### 1. Prometheus Metrics

```yaml
# k8s/prometheus-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s

    scrape_configs:
    - job_name: 'user-service'
      kubernetes_sd_configs:
      - role: pod
        namespaces:
          names:
          - aromasouq-production
      relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_app]
        action: keep
        regex: user-service
```

### 2. Grafana Dashboards

Create dashboards for:
- Request rate per service
- Response time (p50, p95, p99)
- Error rate
- Database connection pool
- Queue size (Kafka, Bull)
- Cache hit ratio

### 3. ELK Stack for Logging

```yaml
# k8s/filebeat-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: filebeat-config
  namespace: logging
data:
  filebeat.yml: |
    filebeat.inputs:
    - type: container
      paths:
        - /var/log/containers/*.log
      processors:
        - add_kubernetes_metadata:
            host: ${NODE_NAME}

    output.elasticsearch:
      hosts: ['${ELASTICSEARCH_HOST}:9200']
      username: ${ELASTICSEARCH_USERNAME}
      password: ${ELASTICSEARCH_PASSWORD}
```

---

## Security Hardening

### 1. Network Policies

```yaml
# k8s/network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: user-service-network-policy
  namespace: aromasouq-production
spec:
  podSelector:
    matchLabels:
      app: user-service
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: api-gateway
    ports:
    - protocol: TCP
      port: 3100
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: postgres
    ports:
    - protocol: TCP
      port: 5432
  - to:
    - podSelector:
        matchLabels:
          app: redis
    ports:
    - protocol: TCP
      port: 6379
```

### 2. Pod Security Standards

```yaml
# k8s/pod-security.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: aromasouq-production
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
```

### 3. Secrets Encryption at Rest

```bash
# Enable encryption on EKS
aws eks associate-encryption-config \
  --cluster-name aromasouq-production \
  --encryption-config '[{"resources":["secrets"],"provider":{"keyArn":"arn:aws:kms:region:account:key/id"}}]'
```

---

## Backup & Disaster Recovery

### 1. Database Backups

**RDS PostgreSQL (Automated)**:
```bash
# Configure automated backups (7-day retention)
aws rds modify-db-instance \
  --db-instance-identifier aromasouq-users \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00"

# Manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier aromasouq-users \
  --db-snapshot-identifier aromasouq-users-$(date +%Y%m%d)
```

**MongoDB (DocumentDB)**:
```bash
# Automated backups (7-day retention)
aws docdb modify-db-cluster \
  --db-cluster-identifier aromasouq-products \
  --backup-retention-period 7
```

### 2. Application State Backups

```yaml
# k8s/backup-job.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: database-backup
  namespace: aromasouq-production
spec:
  schedule: "0 3 * * *"  # Daily at 3 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: aromasouq/backup-tool:latest
            env:
            - name: S3_BUCKET
              value: "aromasouq-backups"
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: database-secrets
                  key: DATABASE_URL
            command:
            - /bin/sh
            - -c
            - |
              pg_dump $DATABASE_URL | gzip | aws s3 cp - s3://$S3_BUCKET/$(date +%Y%m%d).sql.gz
          restartPolicy: OnFailure
```

### 3. Disaster Recovery Plan

**RTO (Recovery Time Objective)**: 4 hours
**RPO (Recovery Point Objective)**: 1 hour

**Steps**:
1. Restore latest RDS snapshot (30 minutes)
2. Restore DocumentDB snapshot (30 minutes)
3. Deploy services from latest Docker images (30 minutes)
4. Verify data integrity (1 hour)
5. Update DNS to new infrastructure (30 minutes)
6. Monitor and validate (1 hour)

---

## Performance Optimization

### 1. CDN Configuration (CloudFront)

```bash
# CloudFront distribution for static assets
aws cloudfront create-distribution \
  --origin-domain-name aromasouq-assets.s3.amazonaws.com \
  --default-cache-behavior "ViewerProtocolPolicy=redirect-to-https,MinTTL=86400" \
  --comment "AromaSouQ static assets"
```

### 2. Database Connection Pooling

```typescript
// services/user-service/src/prisma/prisma.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: ['error', 'warn'],
      // Connection pooling
      pool: {
        max: 20,
        min: 5,
        acquireTimeoutMillis: 30000,
        idleTimeoutMillis: 10000,
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
```

### 3. Redis Caching Strategy

```typescript
// Common caching patterns
- Product catalog: TTL 1 hour
- User sessions: TTL 7 days
- Search results: TTL 15 minutes
- API rate limits: TTL 1 minute
```

---

## Scaling Strategy

### Phase 1: MVP (0-1,000 users)
- 2 replicas per service
- db.t3.small databases
- 1 Kafka broker
- Estimated cost: $500-700/month

### Phase 2: Growth (1,000-10,000 users)
- 3-5 replicas per service
- db.t3.medium databases
- 2 Kafka brokers
- Enable CloudFront CDN
- Estimated cost: $1,500-2,000/month

### Phase 3: Scale (10,000-100,000 users)
- 5-10 replicas per service
- db.r5.large databases
- 3 Kafka brokers
- Multi-region deployment
- Estimated cost: $5,000-8,000/month

### Phase 4: Enterprise (100,000+ users)
- 10-20 replicas per service
- db.r5.xlarge databases
- 5 Kafka brokers
- Multi-region active-active
- Dedicated support
- Estimated cost: $15,000-25,000/month

---

## Maintenance Windows

**Recommended schedule**:
- Weekly: Security patches (Sundays 2-4 AM GST)
- Monthly: Database maintenance (First Sunday 2-6 AM GST)
- Quarterly: Major version upgrades (Planned downtime)

**Zero-downtime deployment**:
```bash
# Rolling update with health checks
kubectl set image deployment/user-service \
  user-service=new-image:tag \
  --record

# Monitor rollout
kubectl rollout status deployment/user-service

# Rollback if issues
kubectl rollout undo deployment/user-service
```

---

## Production Checklist

### Pre-Launch
- [ ] All environment variables configured
- [ ] Secrets stored in AWS Secrets Manager
- [ ] Database migrations tested
- [ ] SSL certificates configured
- [ ] Domain DNS configured (Route 53)
- [ ] CDN configured (CloudFront)
- [ ] Monitoring dashboards created (Grafana)
- [ ] Alerting rules configured (Prometheus)
- [ ] Backup strategy implemented
- [ ] Disaster recovery plan documented
- [ ] Load testing completed
- [ ] Security audit completed
- [ ] PCI DSS compliance verified (Payment Service)
- [ ] GDPR compliance verified (User data)
- [ ] Rate limiting configured
- [ ] API documentation published

### Post-Launch
- [ ] Monitor error rates (< 0.1%)
- [ ] Monitor response times (< 200ms p95)
- [ ] Monitor database performance
- [ ] Monitor queue sizes
- [ ] Monitor costs (AWS Cost Explorer)
- [ ] Weekly security scans
- [ ] Monthly backup verification
- [ ] Quarterly disaster recovery drill

---

## Support & Escalation

### Severity Levels

**P0 - Critical** (Response: 15 min, Resolution: 2 hours)
- Platform down
- Payment processing failure
- Data breach

**P1 - High** (Response: 1 hour, Resolution: 4 hours)
- Service degradation
- Feature unavailable
- Performance issues

**P2 - Medium** (Response: 4 hours, Resolution: 24 hours)
- Minor bugs
- Non-critical features

**P3 - Low** (Response: 24 hours, Resolution: 1 week)
- Feature requests
- Cosmetic issues

---

## Conclusion

This deployment guide provides a production-ready infrastructure for the AromaSouQ platform. Follow the steps sequentially, test thoroughly in staging before production deployment, and maintain regular backups and monitoring.

**Estimated Total Setup Time**: 2-3 weeks
**Team Required**: 1 DevOps Engineer, 1 Backend Developer, 1 QA Engineer
