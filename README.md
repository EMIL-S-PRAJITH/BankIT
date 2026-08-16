# BankIT

## Banking Intelligence Platform

BankIT is a full-stack banking transaction monitoring and risk analysis dashboard.

It provides an overview of customers, transactions, transaction values, risk scores, and transaction statuses.

---

## Features

- Customer dashboard
- Transaction monitoring
- Transaction risk scoring
- Transaction investigation panel
- High-risk customer monitoring
- Search transactions
- Filter transactions by status
- Clear filters
- Review transaction status
- Flag transactions
- Dashboard statistics
- MySQL database integration
- REST API backend
- React frontend
- Success notifications

---

## Technology Stack

### Frontend

- React
- Vite
- Axios
- CSS

### Backend

- Go
- Go `net/http`
- REST APIs

### Database

- MySQL

---

## System Architecture

```text
                    BANKIT
                      |
            +---------+---------+
            |                   |
          React               Go API
        Frontend             Backend
            |                   |
          Axios              REST API
            |                   |
            +---------+---------+
                      |
                    MySQL
                      |
          +-----------+-----------+
          |                       |
      Customers              Transactions