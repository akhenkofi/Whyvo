# Deployment Plan (AWS/GCP)

## Containerization
- Dockerize backend and web admin.
- Store images in ECR (AWS) or Artifact Registry (GCP).

## AWS Option
- Backend: ECS Fargate or EKS
- Database: RDS PostgreSQL
- Web Admin: S3 + CloudFront
- Secrets: AWS Secrets Manager
- Observability: CloudWatch + X-Ray

## GCP Option
- Backend: Cloud Run or GKE
- Database: Cloud SQL for PostgreSQL
- Web Admin: Firebase Hosting or Cloud Storage + CDN
- Secrets: Secret Manager
- Observability: Cloud Logging + Cloud Monitoring

## Recommended MVP Path
1. Start with Cloud Run (GCP) or ECS Fargate (AWS).
2. Use managed PostgreSQL.
3. Add CI/CD from GitHub Actions.
4. Enable HTTPS, domain, backup policy.
5. Add staging environment and smoke tests.
