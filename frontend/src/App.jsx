import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [dashboard, setDashboard] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [notification, setNotification] = useState("");

  useEffect(() => {
    loadBankingData();
  }, []);

  const loadBankingData = async () => {
    try {
      setLoading(true);
      setError("");

      const [dashboardResponse, transactionsResponse, customersResponse] =
        await Promise.all([
          axios.get("https://bankit-production-f1a6.up.railway.app/api/dashboard"),
          axios.get("https://bankit-production-f1a6.up.railway.app/api/transactions"),
          axios.get("https://bankit-production-f1a6.up.railway.app/api/customers"),
        ]);

      setDashboard(dashboardResponse.data);
      setTransactions(transactionsResponse.data);
      setCustomers(customersResponse.data);

    } catch (error) {
      console.error("API Error:", error);
      setError(
        "Unable to connect to BankIT backend. Make sure the Go server is running."
      );
    } finally {
      setLoading(false);
    }
  };
  const updateTransactionStatus = async (transactionId, status) => {
    try {
      await axios.post(
        "https://bankit-production-f1a6.up.railway.app/api/transactions/status",
        {
          transaction_id: transactionId,
          status: status,
        }
      );

      // Reload dashboard data from MySQL
      await loadBankingData();

      // Close investigation panel
      setSelectedTransaction(null);

      setNotification(`Transaction status updated to ${status}.`);

      setTimeout(() => {
        setNotification("");
      }, 3000);

    } catch (error) {
      console.error("Status update error:", error);

      alert(
        "Unable to update transaction status. Please check the Go backend."
      );
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusClass = (status) => {
    if (status === "Success") return "status-success";
    if (status === "Review") return "status-review";
    if (status === "Flagged") return "status-flagged";

    return "";
  };

  const getRiskClass = (riskScore) => {
    if (riskScore >= 80) return "risk-high";
    if (riskScore >= 50) return "risk-medium";

    return "risk-low";
  };
  const filteredTransactions = transactions.filter((transaction) => {
    const customer = customers.find(
      (customer) => customer.id === transaction.customer_id
    );

    const search = searchTerm.toLowerCase();

    const matchesSearch =
      transaction.transaction_id.toLowerCase().includes(search) ||
      transaction.location.toLowerCase().includes(search) ||
      transaction.type.toLowerCase().includes(search) ||
      (customer && customer.name.toLowerCase().includes(search));

    const matchesStatus =
      statusFilter === "All" ||
      transaction.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <h2>Loading BankIT Dashboard...</h2>
        <p>Connecting to banking services</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen">
        <div className="error-box">
          <h1>BankIT</h1>
          <h2>Backend Connection Failed</h2>
          <p>{error}</p>

          <button onClick={loadBankingData}>
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {notification && (
        <div className="notification">
          <span>✓</span>
          {notification}
        </div>
      )}

      {/* ================= HEADER ================= */}

      <header className="topbar">

        <div className="brand">
          <div className="bank-icon">B</div>

          <div>
            <h1>BankIT</h1>
            <span>Banking Intelligence Platform</span>
          </div>
        </div>

        <div className="system-status">
          <span className="online-dot"></span>
          System Operational
        </div>

      </header>


      {/* ================= MAIN ================= */}

      <main className="dashboard">

        <div className="page-heading">
          <div>
            <h2>Security & Transaction Dashboard</h2>
            <p>
              Real-time overview of banking transactions and risk activity
            </p>
          </div>

          <button className="refresh-button" onClick={loadBankingData}>
            ↻ Refresh
          </button>
        </div>


        {/* ================= KPI CARDS ================= */}

        <section className="kpi-grid">

          <div className="kpi-card">
            <div className="kpi-icon blue">👥</div>

            <div>
              <p>Total Customers</p>
              <h3>{dashboard.total_customers}</h3>
              <span>Registered customers</span>
            </div>
          </div>


          <div className="kpi-card">
            <div className="kpi-icon purple">⇄</div>

            <div>
              <p>Total Transactions</p>
              <h3>{dashboard.total_transactions}</h3>
              <span>Processed transactions</span>
            </div>
          </div>


          <div className="kpi-card">
            <div className="kpi-icon green">₹</div>

            <div>
              <p>Transaction Value</p>
              <h3>{formatCurrency(dashboard.total_transaction_value)}</h3>
              <span>Total transaction amount</span>
            </div>
          </div>


          <div className="kpi-card danger-card">
            <div className="kpi-icon red">⚠</div>

            <div>
              <p>Flagged Transactions</p>
              <h3>{dashboard.flagged_transactions}</h3>
              <span>Requires attention</span>
            </div>
          </div>

        </section>


        {/* ================= SECONDARY STATS ================= */}

        <section className="secondary-grid">

          <div className="stat-card">
            <span className="stat-label">Successful</span>
            <strong className="success-text">
              {dashboard.successful_transactions}
            </strong>
            <small>Transactions completed</small>
          </div>


          <div className="stat-card">
            <span className="stat-label">Under Review</span>
            <strong className="review-text">
              {dashboard.review_transactions}
            </strong>
            <small>Transactions requiring review</small>
          </div>


          <div className="stat-card">
            <span className="stat-label">High Risk Customers</span>
            <strong className="danger-text">
              {dashboard.high_risk_customers}
            </strong>
            <small>Customers requiring monitoring</small>
          </div>

        </section>


        {/* ================= TRANSACTIONS ================= */}

        <section className="panel">

          <div className="panel-header">

            <div>
              <h2>Recent Transactions</h2>
              <p>Latest banking activity</p>
            </div>

            <div className="transaction-controls">

              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="status-filter"
              >
                <option value="All">All Status</option>
                <option value="Success">Success</option>
                <option value="Review">Review</option>
                <option value="Flagged">Flagged</option>
              </select>
              <button
                className="clear-filter-button"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("All");
                }}
              >
                Clear
              </button>

              <span className="transaction-count">
                {filteredTransactions.length} Transactions
              </span>

            </div>

          </div>


          <div className="table-container">

            <table>

              <thead>

                <tr>
                  <th>Transaction ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Device</th>
                  <th>Risk Score</th>
                  <th>Status</th>
                </tr>

              </thead>


              <tbody>

                {filteredTransactions.map((transaction) => {

                  const customer = customers.find(
                    (customer) =>
                      customer.id === transaction.customer_id
                  );

                  return (

                    <tr
                      key={transaction.id}
                      onClick={() => setSelectedTransaction(transaction)}
                      className="transaction-row"
                    >

                      <td>
                        <strong>
                          {transaction.transaction_id}
                        </strong>
                      </td>


                      <td>
                        {customer
                          ? customer.name
                          : `Customer ${transaction.customer_id}`}
                      </td>


                      <td className="amount">
                        {formatCurrency(transaction.amount)}
                      </td>


                      <td>
                        <span className="type-badge">
                          {transaction.type}
                        </span>
                      </td>


                      <td>
                        {transaction.location}
                      </td>


                      <td>
                        <span
                          className={
                            transaction.device === "New"
                              ? "device-new"
                              : "device-known"
                          }
                        >
                          {transaction.device}
                        </span>
                      </td>


                      <td>
                        <span
                          className={`risk-score ${getRiskClass(
                            transaction.risk_score
                          )}`}
                        >
                          {transaction.risk_score}
                        </span>
                      </td>


                      <td>
                        <span
                          className={`status-badge ${getStatusClass(
                            transaction.status
                          )}`}
                        >
                          {transaction.status}
                        </span>
                      </td>

                    </tr>

                  );

                })}

              </tbody>

            </table>

          </div>

        </section>
        {/* ================= TRANSACTION INVESTIGATION ================= */}

        {selectedTransaction && (
          <section className="investigation-panel">

            <div className="investigation-header">

              <div>
                <h2>Transaction Investigation</h2>
                <p>
                  Detailed risk analysis for{" "}
                  <strong>
                    {selectedTransaction.transaction_id}
                  </strong>
                </p>
              </div>

              <button
                className="close-button"
                onClick={() => setSelectedTransaction(null)}
              >
                ✕
              </button>

            </div>


            <div className="investigation-content">

              {/* Transaction Information */}

              <div className="investigation-section">

                <h3>Transaction Information</h3>

                <div className="detail-grid">

                  <div className="detail-item">
                    <span>Transaction ID</span>
                    <strong>
                      {selectedTransaction.transaction_id}
                    </strong>
                  </div>

                  <div className="detail-item">
                    <span>Amount</span>
                    <strong>
                      {formatCurrency(selectedTransaction.amount)}
                    </strong>
                  </div>

                  <div className="detail-item">
                    <span>Transaction Type</span>
                    <strong>
                      {selectedTransaction.type}
                    </strong>
                  </div>

                  <div className="detail-item">
                    <span>Location</span>
                    <strong>
                      {selectedTransaction.location}
                    </strong>
                  </div>

                  <div className="detail-item">
                    <span>Device</span>
                    <strong>
                      {selectedTransaction.device}
                    </strong>
                  </div>

                  <div className="detail-item">
                    <span>Time</span>
                    <strong>
                      {selectedTransaction.time}
                    </strong>
                  </div>

                </div>

              </div>


              {/* Risk Information */}

              <div className="investigation-section">

                <h3>Risk Assessment</h3>

                <div className="risk-overview">

                  <div
                    className={`large-risk-score ${getRiskClass(
                      selectedTransaction.risk_score
                    )}`}
                  >
                    {selectedTransaction.risk_score}
                  </div>

                  <div>

                    <strong>Risk Score</strong>

                    <p>
                      {selectedTransaction.risk_score >= 80
                        ? "High-risk transaction requiring immediate attention."
                        : selectedTransaction.risk_score >= 50
                          ? "Medium-risk transaction requiring review."
                          : "Low-risk transaction."}
                    </p>

                  </div>

                </div>
                <div className="risk-indicators">

                  <div
                    className={
                      selectedTransaction.amount >= 100000
                        ? "risk-indicator active"
                        : "risk-indicator"
                    }
                  >
                    {selectedTransaction.amount >= 100000
                      ? "⚠ High transaction amount"
                      : "✓ Normal transaction amount"}
                  </div>

                  <div
                    className={
                      selectedTransaction.device === "New"
                        ? "risk-indicator active"
                        : "risk-indicator"
                    }
                  >
                    {selectedTransaction.device === "New"
                      ? "⚠ New device detected"
                      : "✓ Known device"}
                  </div>

                  <div
                    className={
                      selectedTransaction.risk_score >= 80
                        ? "risk-indicator active"
                        : "risk-indicator"
                    }
                  >
                    {selectedTransaction.risk_score >= 80
                      ? "⚠ High risk score"
                      : "✓ Normal risk score"}
                  </div>

                  <div
                    className={
                      selectedTransaction.location !== "Kochi"
                        ? "risk-indicator active"
                        : "risk-indicator"
                    }
                  >
                    {selectedTransaction.location !== "Kochi"
                      ? "⚠ Unusual transaction location"
                      : "✓ Normal transaction location"}
                  </div>

                </div>



              </div>


              {/* Status */}

              <div className="investigation-section">

                <h3>Transaction Status</h3>

                <div className="status-investigation">

                  <span
                    className={`status-badge ${getStatusClass(
                      selectedTransaction.status
                    )}`}
                  >
                    {selectedTransaction.status}
                  </span>

                </div>

              </div>


              {/* Actions */}

              <div className="investigation-actions">

                <button
                  className="review-button"
                  onClick={() =>
                    updateTransactionStatus(
                      selectedTransaction.id,
                      "Review"

                    )
                  }
                >
                  ✓ Mark as Reviewed
                </button>
                <button
                  className="block-button"
                  onClick={() =>
                    updateTransactionStatus(
                      selectedTransaction.id,
                      "Flagged"
                    )
                  }
                >
                  ⛔ Block Transaction
                </button>


              </div>

            </div>

          </section>
        )}

      </main>

    </div>
  );
}

export default App;