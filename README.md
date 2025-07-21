# Cpay - Comprehensive Financial Platform

A robust, production-ready financial platform with automated testing, monitoring, and CI/CD pipeline.

## 🚀 Features

- **Automated Testing Suite**: Unit, integration, and E2E tests
- **Robust Error Handling**: Retry mechanisms, circuit breakers, and idempotency
- **Comprehensive Monitoring**: Real-time metrics, alerting, and performance tracking
- **Secure Credential Management**: Environment-based configuration
- **CI/CD Pipeline**: Automated testing, building, and deployment
- **Financial Operations**: P2P transfers, cash-in/out, remittances, bill payments

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase CLI
- Git

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Cpay
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd functions && npm install && cd ..
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Firebase Setup**
   ```bash
   firebase login
   firebase use --add
   ```

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Test Categories

- **Unit Tests**: Test individual functions and schemas
- **Integration Tests**: Test component interactions
- **Schema Validation**: Test Zod schema validation
- **Error Handling**: Test retry logic and circuit breakers
- **Monitoring**: Test metrics and alerting

## 🏗️ Building

### Build Frontend
```bash
npm run build
```

### Build Functions
```bash
npm run build:functions
```

### Build All
```bash
npm run build:all
```

## 🚀 Deployment

### Staging Deployment
```bash
npm run deploy:staging
```

### Production Deployment
```bash
npm run deploy:production
```

## 📊 Monitoring & Alerting

### Metrics Tracked
- Transaction duration and success rates
- API response times and error rates
- Performance metrics
- Error counts by type and context

### Alert Rules
- **High Error Rate**: >10% error rate in 5 minutes
- **High Latency**: >5 second average response time
- **No Transactions**: No transactions in 10 minutes

### Custom Alerts
```typescript
import { monitoring } from './utils/monitoring';

monitoring.addAlertRule({
  id: 'custom_alert',
  name: 'Custom Alert',
  condition: (metrics) => /* your condition */,
  severity: 'HIGH',
  message: 'Custom alert message',
  cooldownMinutes: 5
});
```

## 🔧 Error Handling & Resilience

### Retry Logic
```typescript
import { withRetry } from './utils/retry';

const result = await withRetry(
  () => externalApiCall(),
  { maxAttempts: 3, baseDelay: 1000 }
);
```

### Circuit Breaker
```typescript
import { createCircuitBreaker } from './utils/retry';

const circuitBreaker = createCircuitBreaker({
  failureThreshold: 3,
  recoveryTimeout: 30000,
  expectedResponseTime: 5000
});

const result = await circuitBreaker.execute(() => externalApiCall());
```

### Idempotency
```typescript
import { generateIdempotencyKey } from './utils/retry';

const idempotencyKey = generateIdempotencyKey(
  'p2p_transfer',
  userId,
  transactionData
);
```

## 📝 Logging

### Structured Logging
```typescript
import { transactionLogger } from './utils/logger';

transactionLogger.transactionStart('tx123', 'p2p_transfer', 'user123');
transactionLogger.transactionSuccess('tx123', 'p2p_transfer', 'user123');
transactionLogger.transactionError('tx123', 'p2p_transfer', error, 'user123');
```

### Log Levels
- `DEBUG`: Detailed debugging information
- `INFO`: General information
- `WARN`: Warning messages
- `ERROR`: Error messages
- `FATAL`: Critical errors

## 🔒 Security

### Environment Variables
- Never commit sensitive data to version control
- Use `.env.local` for local development
- Use Firebase Secret Manager for production secrets

### Data Sanitization
- Sensitive fields are automatically redacted in logs
- API keys, passwords, and account numbers are masked

## 🏗️ Architecture

### Project Structure
```
Cpay/
├── src/                    # Frontend source code
│   ├── app/               # Next.js app directory
│   ├── components/        # React components
│   ├── functions/         # Frontend business logic
│   └── utils/             # Utility functions
├── functions/             # Firebase Functions
│   ├── src/               # Backend source code
│   │   ├── transactions/  # Transaction handlers
│   │   ├── partners/      # Partner integrations
│   │   ├── kyc/          # KYC processing
│   │   └── utils/         # Backend utilities
│   └── __tests__/         # Backend tests
├── .github/               # GitHub Actions workflows
└── docs/                  # Documentation
```

### Key Components
- **Transaction Handlers**: Process financial transactions
- **Partner Integrations**: Connect with banks and payment providers
- **KYC System**: Identity verification and compliance
- **Monitoring System**: Track performance and generate alerts
- **Error Handling**: Retry logic and circuit breakers

## 🔄 CI/CD Pipeline

### Automated Workflow
1. **Test**: Run all tests and generate coverage reports
2. **Build**: Build frontend and functions
3. **Security Scan**: Run security audits
4. **Deploy Staging**: Deploy to staging environment
5. **Performance Test**: Run Lighthouse CI tests
6. **Deploy Production**: Deploy to production (main branch only)

### Environment Management
- **Staging**: `develop` branch deployments
- **Production**: `main` branch deployments
- **Feature Branches**: Test and validate changes

## 🐛 Troubleshooting

### Common Issues

1. **Test Failures**
   ```bash
   npm run test:coverage
   # Check coverage reports for failing tests
   ```

2. **Build Errors**
   ```bash
   npm run typecheck
   npm run lint
   # Fix TypeScript and linting errors
   ```

3. **Deployment Issues**
   ```bash
   firebase projects:list
   firebase use <project-id>
   # Verify correct project is selected
   ```

### Debug Mode
```bash
LOG_LEVEL=debug npm run dev
```

## 📈 Performance

### Optimization Tips
- Use circuit breakers for external API calls
- Implement proper retry logic with exponential backoff
- Monitor performance metrics and set up alerts
- Use idempotency keys for financial transactions

### Monitoring Dashboard
- Track transaction success rates
- Monitor API response times
- Set up alerts for critical issues
- Review performance trends

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

### Development Guidelines
- Write tests for all new features
- Follow the existing code style
- Update documentation as needed
- Use conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the troubleshooting guide

---

**Built with ❤️ for robust financial systems**
