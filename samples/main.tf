terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

variable "environment" {
  type        = string
  description = "Deployment environment"
  default     = "staging"
}

locals {
  tags = {
    Project     = "dusk-office"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_s3_bucket" "theme_assets" {
  bucket = "dusk-office-${var.environment}-themes"

  tags = local.tags
}

resource "aws_s3_bucket_versioning" "theme_assets" {
  bucket = aws_s3_bucket.theme_assets.id

  versioning_configuration {
    status = "Enabled"
  }
}

output "bucket_name" {
  value       = aws_s3_bucket.theme_assets.bucket
  description = "Theme asset bucket"
}
