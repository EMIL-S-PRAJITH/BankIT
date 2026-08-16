package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	_ "github.com/go-sql-driver/mysql"
	"github.com/joho/godotenv"
)

var db *sql.DB

// Customer represents a customer from the database.
type Customer struct {
	ID            int     `json:"id"`
	Name          string  `json:"name"`
	AccountNumber string  `json:"account_number"`
	Type          string  `json:"type"`
	Balance       float64 `json:"balance"`
	City          string  `json:"city"`
	Risk          string  `json:"risk"`
}

// Transaction represents a banking transaction.
type Transaction struct {
	ID            int     `json:"id"`
	TransactionID string  `json:"transaction_id"`
	CustomerID    int     `json:"customer_id"`
	Amount        float64 `json:"amount"`
	Type          string  `json:"type"`
	Location      string  `json:"location"`
	Time          string  `json:"time"`
	Device        string  `json:"device"`
	RiskScore     int     `json:"risk_score"`
	Status        string  `json:"status"`
	Date          string  `json:"date"`
}

// DashboardStats represents banking dashboard statistics.
type DashboardStats struct {
	TotalCustomers         int     `json:"total_customers"`
	TotalTransactions      int     `json:"total_transactions"`
	TotalTransactionValue  float64 `json:"total_transaction_value"`
	SuccessfulTransactions int     `json:"successful_transactions"`
	ReviewTransactions     int     `json:"review_transactions"`
	FlaggedTransactions    int     `json:"flagged_transactions"`
	HighRiskCustomers      int     `json:"high_risk_customers"`
}

func main() {

	// --------------------------------
	// 1. Load environment variables
	// --------------------------------

	err := godotenv.Load()

	if err != nil {
		log.Println("Warning: .env file not found")
	}

	// --------------------------------
	// 2. Create MySQL connection
	// --------------------------------

	dsn := fmt.Sprintf(
		"%s:%s@tcp(%s:%s)/%s?parseTime=true",
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_NAME"),
	)

	db, err = sql.Open("mysql", dsn)

	if err != nil {
		log.Fatal("Could not create database connection:", err)
	}

	// --------------------------------
	// 3. Test database connection
	// --------------------------------

	err = db.Ping()

	if err != nil {
		log.Fatal("Could not connect to MySQL:", err)
	}

	fmt.Println("================================")
	fmt.Println("       BankIT Backend")
	fmt.Println("================================")
	fmt.Println("MySQL connected successfully")

	// --------------------------------
	// 4. Register API routes
	// --------------------------------

	http.HandleFunc("/api/health", healthHandler)

	http.HandleFunc("/api/customers", customersHandler)

	http.HandleFunc("/api/transactions", transactionsHandler)

	http.HandleFunc("/api/dashboard", dashboardHandler)

	http.HandleFunc("/api/transactions/status", updateTransactionStatusHandler)
	// --------------------------------
	// 5. Start server
	// --------------------------------

	port := os.Getenv("PORT")

	if port == "" {
		port = "5000"
	}

	fmt.Println("Server running on:")
	fmt.Println("http://localhost:" + port)

	err = http.ListenAndServe(
		":"+port,
		enableCORS(http.DefaultServeMux),
	)

	if err != nil {
		log.Fatal(err)
	}
}

// ========================================
// HEALTH API
// ========================================

func healthHandler(w http.ResponseWriter, r *http.Request) {

	w.Header().Set(
		"Content-Type",
		"application/json",
	)

	fmt.Fprint(w, `{
		"status": "ok",
		"database": "connected",
		"application": "BankIT"
	}`)
}

// ========================================
// CUSTOMERS API
// ========================================

func customersHandler(w http.ResponseWriter, r *http.Request) {

	// Only allow GET requests
	if r.Method != http.MethodGet {

		http.Error(
			w,
			"Method not allowed",
			http.StatusMethodNotAllowed,
		)

		return
	}

	// Query customers from MySQL
	rows, err := db.Query(`
		SELECT
			id,
			name,
			account_number,
			type,
			balance,
			city,
			risk
		FROM customers
		ORDER BY id
	`)

	if err != nil {

		http.Error(
			w,
			"Database query failed",
			http.StatusInternalServerError,
		)

		log.Println("Customer query error:", err)

		return
	}

	defer rows.Close()

	// Create empty slice
	customers := []Customer{}

	// Read every row
	for rows.Next() {

		var customer Customer

		err := rows.Scan(
			&customer.ID,
			&customer.Name,
			&customer.AccountNumber,
			&customer.Type,
			&customer.Balance,
			&customer.City,
			&customer.Risk,
		)

		if err != nil {

			http.Error(
				w,
				"Failed to read customer",
				http.StatusInternalServerError,
			)

			return
		}

		customers = append(
			customers,
			customer,
		)
	}

	// Check for iteration errors
	if err := rows.Err(); err != nil {

		http.Error(
			w,
			"Failed to process customers",
			http.StatusInternalServerError,
		)

		return
	}

	// Return JSON
	w.Header().Set(
		"Content-Type",
		"application/json",
	)

	json.NewEncoder(w).Encode(customers)
}

// ========================================
// TRANSACTIONS API
// ========================================

func transactionsHandler(w http.ResponseWriter, r *http.Request) {

	// Only allow GET requests
	if r.Method != http.MethodGet {

		http.Error(
			w,
			"Method not allowed",
			http.StatusMethodNotAllowed,
		)

		return
	}

	// Query transactions from MySQL
	rows, err := db.Query(`
		SELECT
			id,
			transaction_id,
			customer_id,
			amount,
			type,
			location,
			time,
			device,
			risk_score,
			status,
			date
		FROM transactions
		ORDER BY id DESC
	`)

	if err != nil {

		http.Error(
			w,
			"Database query failed",
			http.StatusInternalServerError,
		)

		log.Println("Transaction query error:", err)

		return
	}

	defer rows.Close()

	// Create empty transaction list
	transactions := []Transaction{}

	// Read each transaction
	for rows.Next() {

		var transaction Transaction

		err := rows.Scan(
			&transaction.ID,
			&transaction.TransactionID,
			&transaction.CustomerID,
			&transaction.Amount,
			&transaction.Type,
			&transaction.Location,
			&transaction.Time,
			&transaction.Device,
			&transaction.RiskScore,
			&transaction.Status,
			&transaction.Date,
		)

		if err != nil {

			http.Error(
				w,
				"Failed to read transaction",
				http.StatusInternalServerError,
			)

			log.Println("Transaction scan error:", err)

			return
		}

		transactions = append(
			transactions,
			transaction,
		)
	}

	// Check for database iteration errors
	if err := rows.Err(); err != nil {

		http.Error(
			w,
			"Failed to process transactions",
			http.StatusInternalServerError,
		)

		return
	}

	// Return JSON response
	w.Header().Set(
		"Content-Type",
		"application/json",
	)

	json.NewEncoder(w).Encode(transactions)
}

// ========================================
// DASHBOARD API
// ========================================

func dashboardHandler(w http.ResponseWriter, r *http.Request) {

	// Only allow GET requests
	if r.Method != http.MethodGet {

		http.Error(
			w,
			"Method not allowed",
			http.StatusMethodNotAllowed,
		)

		return
	}

	var stats DashboardStats

	// ========================================
	// 1. Total Customers
	// ========================================

	err := db.QueryRow(`
		SELECT COUNT(*)
		FROM customers
	`).Scan(&stats.TotalCustomers)

	if err != nil {

		http.Error(
			w,
			"Failed to calculate customer statistics",
			http.StatusInternalServerError,
		)

		log.Println("Customer statistics error:", err)

		return
	}

	// ========================================
	// 2. Transaction Statistics
	// ========================================

	err = db.QueryRow(`
		SELECT
			COUNT(*),
			COALESCE(SUM(amount), 0),
			COALESCE(SUM(status = 'Success'), 0),
			COALESCE(SUM(status = 'Review'), 0),
			COALESCE(SUM(status = 'Flagged'), 0)
		FROM transactions
	`).Scan(
		&stats.TotalTransactions,
		&stats.TotalTransactionValue,
		&stats.SuccessfulTransactions,
		&stats.ReviewTransactions,
		&stats.FlaggedTransactions,
	)

	if err != nil {

		http.Error(
			w,
			"Failed to calculate transaction statistics",
			http.StatusInternalServerError,
		)

		log.Println("Transaction statistics error:", err)

		return
	}

	// ========================================
	// 3. High Risk Customers
	// ========================================

	err = db.QueryRow(`
		SELECT COUNT(*)
		FROM customers
		WHERE risk = 'High'
	`).Scan(&stats.HighRiskCustomers)

	if err != nil {

		http.Error(
			w,
			"Failed to calculate risk statistics",
			http.StatusInternalServerError,
		)

		log.Println("Risk statistics error:", err)

		return
	}

	// ========================================
	// 4. Return JSON
	// ========================================

	w.Header().Set(
		"Content-Type",
		"application/json",
	)

	json.NewEncoder(w).Encode(stats)
}

// ========================================
// CORS MIDDLEWARE
// ========================================

func enableCORS(handler http.Handler) http.Handler {

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		// Allow React frontend
		origin := r.Header.Get("Origin")

		if origin == "http://localhost:5173" ||
			origin == "https://frontend-production-2adb.up.railway.app" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
		}
		w.Header().Set(
			"Access-Control-Allow-Methods",
			"GET, POST, PUT, DELETE, OPTIONS",
		)

		w.Header().Set(
			"Access-Control-Allow-Headers",
			"Content-Type",
		)

		// Handle browser preflight request
		if r.Method == http.MethodOptions {

			w.WriteHeader(http.StatusOK)

			return
		}

		handler.ServeHTTP(w, r)
	})
}

// ========================================
// UPDATE TRANSACTION STATUS API
// ========================================

func updateTransactionStatusHandler(w http.ResponseWriter, r *http.Request) {

	// Only allow POST requests
	if r.Method != http.MethodPost {
		http.Error(
			w,
			"Method not allowed",
			http.StatusMethodNotAllowed,
		)

		return
	}

	// Read JSON request
	var request struct {
		TransactionID int    `json:"transaction_id"`
		Status        string `json:"status"`
	}

	err := json.NewDecoder(r.Body).Decode(&request)

	if err != nil {
		http.Error(
			w,
			"Invalid request",
			http.StatusBadRequest,
		)

		return
	}

	// Validate status
	if request.Status != "Review" &&
		request.Status != "Flagged" &&
		request.Status != "Success" {

		http.Error(
			w,
			"Invalid transaction status",
			http.StatusBadRequest,
		)

		return
	}

	// Update MySQL
	result, err := db.Exec(`
		UPDATE transactions
		SET status = ?
		WHERE id = ?
	`, request.Status, request.TransactionID)

	if err != nil {

		http.Error(
			w,
			"Failed to update transaction",
			http.StatusInternalServerError,
		)

		log.Println("Transaction update error:", err)

		return
	}

	// Check whether transaction existed
	rowsAffected, err := result.RowsAffected()

	if err != nil {

		http.Error(
			w,
			"Failed to verify transaction update",
			http.StatusInternalServerError,
		)

		return
	}

	if rowsAffected == 0 {

		http.Error(
			w,
			"Transaction not found",
			http.StatusNotFound,
		)

		return
	}

	// Return success response
	w.Header().Set(
		"Content-Type",
		"application/json",
	)

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":        true,
		"transaction_id": request.TransactionID,
		"status":         request.Status,
		"message":        "Transaction status updated successfully",
	})
}
