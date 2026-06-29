// lib/examples-data.ts
// Auto-curated SQL example library — flawed, realistic queries across common
// industry domains, used to seed the Examples tab and the Optimizer.

export interface SqlExample {
  id: string;
  domain: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  title: string;
  issueTag: string;
  description: string;
  sql: string;
}

export const DOMAIN_ICONS: Record<string, string> = {
  "E-Commerce": "ShoppingCart",
  "Healthcare": "HeartPulse",
  "Banking & Finance": "Landmark",
  "HR & Payroll": "Users",
  "SaaS Analytics": "LineChart",
  "Social Media": "MessageCircle",
  "Real Estate": "Home",
  "Logistics & Shipping": "Truck",
  "Education": "GraduationCap",
  "Gaming": "Gamepad2",
  "Marketing": "Megaphone",
  "Travel & Hospitality": "Plane"
};

export const SQL_EXAMPLES: SqlExample[] = [
  {
    "id": "ex001",
    "domain": "E-Commerce",
    "difficulty": "Beginner",
    "title": "Unnecessary SELECT DISTINCT \u2014 E-Commerce",
    "issueTag": "Unnecessary SELECT DISTINCT",
    "description": "DISTINCT forces a sort/hash pass to dedupe rows that are likely already unique from the JOIN.",
    "sql": "SELECT DISTINCT reviews.*\nFROM reviews\nJOIN customers ON reviews.customer_id = customers.id;"
  },
  {
    "id": "ex002",
    "domain": "E-Commerce",
    "difficulty": "Intermediate",
    "title": "Implicit JOIN (Comma) \u2014 E-Commerce",
    "issueTag": "Implicit JOIN (Comma)",
    "description": "Comma-style joins block the query planner from reordering joins for the best plan.",
    "sql": "SELECT order_items.*, orders.*\nFROM order_items, orders\nWHERE order_items.order_id = orders.id;"
  },
  {
    "id": "ex003",
    "domain": "E-Commerce",
    "difficulty": "Advanced",
    "title": "Leading Wildcard LIKE \u2014 E-Commerce",
    "issueTag": "Leading Wildcard LIKE",
    "description": "A LIKE '%text%' pattern can't use an index and forces a full table scan.",
    "sql": "SELECT * FROM orders\nWHERE status LIKE '%search%';"
  },
  {
    "id": "ex004",
    "domain": "E-Commerce",
    "difficulty": "Beginner",
    "title": "SELECT * with No LIMIT \u2014 E-Commerce",
    "issueTag": "SELECT * with No LIMIT",
    "description": "Returns every column and every row \u2014 wastes I/O and risks unbounded result sets.",
    "sql": "SELECT * FROM products\nORDER BY products.id DESC;"
  },
  {
    "id": "ex005",
    "domain": "E-Commerce",
    "difficulty": "Intermediate",
    "title": "OR Across Non-Indexed Columns \u2014 E-Commerce",
    "issueTag": "OR Across Non-Indexed Columns",
    "description": "An OR across two different columns usually can't be satisfied by a single index.",
    "sql": "SELECT * FROM products\nWHERE name = 'value1' OR category = 'value2';"
  },
  {
    "id": "ex006",
    "domain": "E-Commerce",
    "difficulty": "Advanced",
    "title": "Correlated Subquery (N+1) \u2014 E-Commerce",
    "issueTag": "Correlated Subquery (N+1)",
    "description": "Runs a subquery once per outer row instead of using a single JOIN + GROUP BY.",
    "sql": "SELECT customers.id, customers.name,\n  (SELECT COUNT(*) FROM orders WHERE orders.customer_id = customers.id) AS related_count\nFROM customers;"
  },
  {
    "id": "ex007",
    "domain": "E-Commerce",
    "difficulty": "Beginner",
    "title": "Subquery in SELECT Clause \u2014 E-Commerce",
    "issueTag": "Subquery in SELECT Clause",
    "description": "A subquery in the SELECT list re-executes for every row instead of being computed once via JOIN.",
    "sql": "SELECT orders.*,\n  (SELECT MAX(price) FROM order_items WHERE order_items.order_id = orders.id) AS last_activity\nFROM orders;"
  },
  {
    "id": "ex008",
    "domain": "E-Commerce",
    "difficulty": "Intermediate",
    "title": "Multiple Correlated Subqueries \u2014 E-Commerce",
    "issueTag": "Multiple Correlated Subqueries",
    "description": "Stacks several N+1 subqueries in one SELECT, compounding the performance hit.",
    "sql": "SELECT products.id,\n  (SELECT COUNT(*) FROM order_items WHERE order_items.product_id = products.id) AS c1,\n  (SELECT COUNT(*) FROM reviews WHERE reviews.product_id = products.id) AS c2\nFROM products\nWHERE products.id > 0;"
  },
  {
    "id": "ex009",
    "domain": "E-Commerce",
    "difficulty": "Advanced",
    "title": "Function on Indexed Column \u2014 E-Commerce",
    "issueTag": "Function on Indexed Column",
    "description": "Wrapping a column in YEAR()/MONTH() prevents the index on that column from being used.",
    "sql": "SELECT * FROM customers\nWHERE YEAR(created_at) = 2024 AND MONTH(created_at) = 6;"
  },
  {
    "id": "ex010",
    "domain": "Healthcare",
    "difficulty": "Beginner",
    "title": "NOT IN with Subquery \u2014 Healthcare",
    "issueTag": "NOT IN with Subquery",
    "description": "NOT IN silently returns nothing if the subquery contains a single NULL \u2014 use NOT EXISTS instead.",
    "sql": "SELECT * FROM patients\nWHERE id NOT IN (SELECT patient_id FROM prescriptions);"
  },
  {
    "id": "ex011",
    "domain": "Healthcare",
    "difficulty": "Intermediate",
    "title": "Function on Indexed Column \u2014 Healthcare",
    "issueTag": "Function on Indexed Column",
    "description": "Wrapping a column in YEAR()/MONTH() prevents the index on that column from being used.",
    "sql": "SELECT * FROM lab_results\nWHERE YEAR(tested_at) = 2024 AND MONTH(tested_at) = 6;"
  },
  {
    "id": "ex012",
    "domain": "Healthcare",
    "difficulty": "Advanced",
    "title": "Implicit JOIN (Comma) \u2014 Healthcare",
    "issueTag": "Implicit JOIN (Comma)",
    "description": "Comma-style joins block the query planner from reordering joins for the best plan.",
    "sql": "SELECT lab_results.*, patients.*\nFROM lab_results, patients\nWHERE lab_results.patient_id = patients.id;"
  },
  {
    "id": "ex013",
    "domain": "Healthcare",
    "difficulty": "Beginner",
    "title": "Unnecessary SELECT DISTINCT \u2014 Healthcare",
    "issueTag": "Unnecessary SELECT DISTINCT",
    "description": "DISTINCT forces a sort/hash pass to dedupe rows that are likely already unique from the JOIN.",
    "sql": "SELECT DISTINCT prescriptions.*\nFROM prescriptions\nJOIN patients ON prescriptions.patient_id = patients.id;"
  },
  {
    "id": "ex014",
    "domain": "Healthcare",
    "difficulty": "Intermediate",
    "title": "SELECT * with No LIMIT \u2014 Healthcare",
    "issueTag": "SELECT * with No LIMIT",
    "description": "Returns every column and every row \u2014 wastes I/O and risks unbounded result sets.",
    "sql": "SELECT * FROM patients\nORDER BY patients.id DESC;"
  },
  {
    "id": "ex015",
    "domain": "Healthcare",
    "difficulty": "Advanced",
    "title": "OR Across Non-Indexed Columns \u2014 Healthcare",
    "issueTag": "OR Across Non-Indexed Columns",
    "description": "An OR across two different columns usually can't be satisfied by a single index.",
    "sql": "SELECT * FROM lab_results\nWHERE test_name = 'value1' OR result_value = 'value2';"
  },
  {
    "id": "ex016",
    "domain": "Healthcare",
    "difficulty": "Beginner",
    "title": "Leading Wildcard LIKE \u2014 Healthcare",
    "issueTag": "Leading Wildcard LIKE",
    "description": "A LIKE '%text%' pattern can't use an index and forces a full table scan.",
    "sql": "SELECT * FROM lab_results\nWHERE test_name LIKE '%search%';"
  },
  {
    "id": "ex017",
    "domain": "Healthcare",
    "difficulty": "Intermediate",
    "title": "Correlated Subquery (N+1) \u2014 Healthcare",
    "issueTag": "Correlated Subquery (N+1)",
    "description": "Runs a subquery once per outer row instead of using a single JOIN + GROUP BY.",
    "sql": "SELECT patients.id, patients.name,\n  (SELECT COUNT(*) FROM lab_results WHERE lab_results.patient_id = patients.id) AS related_count\nFROM patients;"
  },
  {
    "id": "ex018",
    "domain": "Healthcare",
    "difficulty": "Advanced",
    "title": "Multiple Correlated Subqueries \u2014 Healthcare",
    "issueTag": "Multiple Correlated Subqueries",
    "description": "Stacks several N+1 subqueries in one SELECT, compounding the performance hit.",
    "sql": "SELECT patients.id,\n  (SELECT COUNT(*) FROM lab_results WHERE lab_results.patient_id = patients.id) AS c1,\n  (SELECT COUNT(*) FROM appointments WHERE appointments.patient_id = patients.id) AS c2\nFROM patients\nWHERE patients.id > 0;"
  },
  {
    "id": "ex019",
    "domain": "Banking & Finance",
    "difficulty": "Beginner",
    "title": "Unnecessary SELECT DISTINCT \u2014 Banking & Finance",
    "issueTag": "Unnecessary SELECT DISTINCT",
    "description": "DISTINCT forces a sort/hash pass to dedupe rows that are likely already unique from the JOIN.",
    "sql": "SELECT DISTINCT credit_cards.*\nFROM credit_cards\nJOIN accounts ON credit_cards.customer_id = accounts.id;"
  },
  {
    "id": "ex020",
    "domain": "Banking & Finance",
    "difficulty": "Intermediate",
    "title": "Function on Indexed Column \u2014 Banking & Finance",
    "issueTag": "Function on Indexed Column",
    "description": "Wrapping a column in YEAR()/MONTH() prevents the index on that column from being used.",
    "sql": "SELECT * FROM loans\nWHERE YEAR(status) = 2024 AND MONTH(status) = 6;"
  },
  {
    "id": "ex021",
    "domain": "Banking & Finance",
    "difficulty": "Advanced",
    "title": "Leading Wildcard LIKE \u2014 Banking & Finance",
    "issueTag": "Leading Wildcard LIKE",
    "description": "A LIKE '%text%' pattern can't use an index and forces a full table scan.",
    "sql": "SELECT * FROM transactions\nWHERE type LIKE '%search%';"
  },
  {
    "id": "ex022",
    "domain": "Banking & Finance",
    "difficulty": "Beginner",
    "title": "Multiple Correlated Subqueries \u2014 Banking & Finance",
    "issueTag": "Multiple Correlated Subqueries",
    "description": "Stacks several N+1 subqueries in one SELECT, compounding the performance hit.",
    "sql": "SELECT accounts.id,\n  (SELECT COUNT(*) FROM transactions WHERE transactions.account_id = accounts.id) AS c1,\n  (SELECT COUNT(*) FROM loans WHERE loans.customer_id = accounts.id) AS c2\nFROM accounts\nWHERE accounts.id > 0;"
  },
  {
    "id": "ex023",
    "domain": "Banking & Finance",
    "difficulty": "Intermediate",
    "title": "SELECT * with No LIMIT \u2014 Banking & Finance",
    "issueTag": "SELECT * with No LIMIT",
    "description": "Returns every column and every row \u2014 wastes I/O and risks unbounded result sets.",
    "sql": "SELECT * FROM loans\nORDER BY loans.id DESC;"
  },
  {
    "id": "ex024",
    "domain": "Banking & Finance",
    "difficulty": "Advanced",
    "title": "NOT IN with Subquery \u2014 Banking & Finance",
    "issueTag": "NOT IN with Subquery",
    "description": "NOT IN silently returns nothing if the subquery contains a single NULL \u2014 use NOT EXISTS instead.",
    "sql": "SELECT * FROM accounts\nWHERE id NOT IN (SELECT customer_id FROM credit_cards);"
  },
  {
    "id": "ex025",
    "domain": "Banking & Finance",
    "difficulty": "Beginner",
    "title": "OR Across Non-Indexed Columns \u2014 Banking & Finance",
    "issueTag": "OR Across Non-Indexed Columns",
    "description": "An OR across two different columns usually can't be satisfied by a single index.",
    "sql": "SELECT * FROM loans\nWHERE status = 'value1' OR status = 'value2';"
  },
  {
    "id": "ex026",
    "domain": "Banking & Finance",
    "difficulty": "Intermediate",
    "title": "Implicit JOIN (Comma) \u2014 Banking & Finance",
    "issueTag": "Implicit JOIN (Comma)",
    "description": "Comma-style joins block the query planner from reordering joins for the best plan.",
    "sql": "SELECT credit_cards.*, accounts.*\nFROM credit_cards, accounts\nWHERE credit_cards.customer_id = accounts.id;"
  },
  {
    "id": "ex027",
    "domain": "Banking & Finance",
    "difficulty": "Advanced",
    "title": "Correlated Subquery (N+1) \u2014 Banking & Finance",
    "issueTag": "Correlated Subquery (N+1)",
    "description": "Runs a subquery once per outer row instead of using a single JOIN + GROUP BY.",
    "sql": "SELECT accounts.id, accounts.customer_id,\n  (SELECT COUNT(*) FROM loans WHERE loans.customer_id = accounts.id) AS related_count\nFROM accounts;"
  },
  {
    "id": "ex028",
    "domain": "HR & Payroll",
    "difficulty": "Beginner",
    "title": "NOT IN with Subquery \u2014 HR & Payroll",
    "issueTag": "NOT IN with Subquery",
    "description": "NOT IN silently returns nothing if the subquery contains a single NULL \u2014 use NOT EXISTS instead.",
    "sql": "SELECT * FROM employees\nWHERE id NOT IN (SELECT employee_id FROM performance_reviews);"
  },
  {
    "id": "ex029",
    "domain": "HR & Payroll",
    "difficulty": "Intermediate",
    "title": "Multiple Correlated Subqueries \u2014 HR & Payroll",
    "issueTag": "Multiple Correlated Subqueries",
    "description": "Stacks several N+1 subqueries in one SELECT, compounding the performance hit.",
    "sql": "SELECT employees.id,\n  (SELECT COUNT(*) FROM performance_reviews WHERE performance_reviews.employee_id = employees.id) AS c1,\n  (SELECT COUNT(*) FROM payroll WHERE payroll.employee_id = employees.id) AS c2\nFROM employees\nWHERE employees.id > 0;"
  },
  {
    "id": "ex030",
    "domain": "HR & Payroll",
    "difficulty": "Advanced",
    "title": "Correlated Subquery (N+1) \u2014 HR & Payroll",
    "issueTag": "Correlated Subquery (N+1)",
    "description": "Runs a subquery once per outer row instead of using a single JOIN + GROUP BY.",
    "sql": "SELECT employees.id, employees.name,\n  (SELECT COUNT(*) FROM attendance WHERE attendance.employee_id = employees.id) AS related_count\nFROM employees;"
  },
  {
    "id": "ex031",
    "domain": "HR & Payroll",
    "difficulty": "Beginner",
    "title": "Function on Indexed Column \u2014 HR & Payroll",
    "issueTag": "Function on Indexed Column",
    "description": "Wrapping a column in YEAR()/MONTH() prevents the index on that column from being used.",
    "sql": "SELECT * FROM payroll\nWHERE YEAR(paid_at) = 2024 AND MONTH(paid_at) = 6;"
  },
  {
    "id": "ex032",
    "domain": "HR & Payroll",
    "difficulty": "Intermediate",
    "title": "OR Across Non-Indexed Columns \u2014 HR & Payroll",
    "issueTag": "OR Across Non-Indexed Columns",
    "description": "An OR across two different columns usually can't be satisfied by a single index.",
    "sql": "SELECT * FROM performance_reviews\nWHERE employee_id = 'value1' OR employee_id = 'value2';"
  },
  {
    "id": "ex033",
    "domain": "HR & Payroll",
    "difficulty": "Advanced",
    "title": "Implicit JOIN (Comma) \u2014 HR & Payroll",
    "issueTag": "Implicit JOIN (Comma)",
    "description": "Comma-style joins block the query planner from reordering joins for the best plan.",
    "sql": "SELECT performance_reviews.*, employees.*\nFROM performance_reviews, employees\nWHERE performance_reviews.employee_id = employees.id;"
  },
  {
    "id": "ex034",
    "domain": "HR & Payroll",
    "difficulty": "Beginner",
    "title": "SELECT * with No LIMIT \u2014 HR & Payroll",
    "issueTag": "SELECT * with No LIMIT",
    "description": "Returns every column and every row \u2014 wastes I/O and risks unbounded result sets.",
    "sql": "SELECT * FROM performance_reviews\nORDER BY performance_reviews.id DESC;"
  },
  {
    "id": "ex035",
    "domain": "HR & Payroll",
    "difficulty": "Intermediate",
    "title": "Unnecessary SELECT DISTINCT \u2014 HR & Payroll",
    "issueTag": "Unnecessary SELECT DISTINCT",
    "description": "DISTINCT forces a sort/hash pass to dedupe rows that are likely already unique from the JOIN.",
    "sql": "SELECT DISTINCT performance_reviews.*\nFROM performance_reviews\nJOIN employees ON performance_reviews.employee_id = employees.id;"
  },
  {
    "id": "ex036",
    "domain": "SaaS Analytics",
    "difficulty": "Beginner",
    "title": "Multiple Correlated Subqueries \u2014 SaaS Analytics",
    "issueTag": "Multiple Correlated Subqueries",
    "description": "Stacks several N+1 subqueries in one SELECT, compounding the performance hit.",
    "sql": "SELECT users.id,\n  (SELECT COUNT(*) FROM sessions WHERE sessions.user_id = users.id) AS c1,\n  (SELECT COUNT(*) FROM feature_usage WHERE feature_usage.user_id = users.id) AS c2\nFROM users\nWHERE users.id > 0;"
  },
  {
    "id": "ex037",
    "domain": "SaaS Analytics",
    "difficulty": "Intermediate",
    "title": "Unnecessary SELECT DISTINCT \u2014 SaaS Analytics",
    "issueTag": "Unnecessary SELECT DISTINCT",
    "description": "DISTINCT forces a sort/hash pass to dedupe rows that are likely already unique from the JOIN.",
    "sql": "SELECT DISTINCT feature_usage.*\nFROM feature_usage\nJOIN users ON feature_usage.user_id = users.id;"
  },
  {
    "id": "ex038",
    "domain": "SaaS Analytics",
    "difficulty": "Advanced",
    "title": "Function on Indexed Column \u2014 SaaS Analytics",
    "issueTag": "Function on Indexed Column",
    "description": "Wrapping a column in YEAR()/MONTH() prevents the index on that column from being used.",
    "sql": "SELECT * FROM subscriptions\nWHERE YEAR(renewed_at) = 2024 AND MONTH(renewed_at) = 6;"
  },
  {
    "id": "ex039",
    "domain": "SaaS Analytics",
    "difficulty": "Beginner",
    "title": "OR Across Non-Indexed Columns \u2014 SaaS Analytics",
    "issueTag": "OR Across Non-Indexed Columns",
    "description": "An OR across two different columns usually can't be satisfied by a single index.",
    "sql": "SELECT * FROM sessions\nWHERE device = 'value1' OR device = 'value2';"
  },
  {
    "id": "ex040",
    "domain": "SaaS Analytics",
    "difficulty": "Intermediate",
    "title": "Correlated Subquery (N+1) \u2014 SaaS Analytics",
    "issueTag": "Correlated Subquery (N+1)",
    "description": "Runs a subquery once per outer row instead of using a single JOIN + GROUP BY.",
    "sql": "SELECT users.id, users.email,\n  (SELECT COUNT(*) FROM sessions WHERE sessions.user_id = users.id) AS related_count\nFROM users;"
  },
  {
    "id": "ex041",
    "domain": "SaaS Analytics",
    "difficulty": "Advanced",
    "title": "NOT IN with Subquery \u2014 SaaS Analytics",
    "issueTag": "NOT IN with Subquery",
    "description": "NOT IN silently returns nothing if the subquery contains a single NULL \u2014 use NOT EXISTS instead.",
    "sql": "SELECT * FROM users\nWHERE id NOT IN (SELECT user_id FROM subscriptions);"
  },
  {
    "id": "ex042",
    "domain": "SaaS Analytics",
    "difficulty": "Beginner",
    "title": "Implicit JOIN (Comma) \u2014 SaaS Analytics",
    "issueTag": "Implicit JOIN (Comma)",
    "description": "Comma-style joins block the query planner from reordering joins for the best plan.",
    "sql": "SELECT events.*, users.*\nFROM events, users\nWHERE events.user_id = users.id;"
  },
  {
    "id": "ex043",
    "domain": "SaaS Analytics",
    "difficulty": "Intermediate",
    "title": "SELECT * with No LIMIT \u2014 SaaS Analytics",
    "issueTag": "SELECT * with No LIMIT",
    "description": "Returns every column and every row \u2014 wastes I/O and risks unbounded result sets.",
    "sql": "SELECT * FROM sessions\nORDER BY sessions.id DESC;"
  },
  {
    "id": "ex044",
    "domain": "Social Media",
    "difficulty": "Beginner",
    "title": "Subquery in SELECT Clause \u2014 Social Media",
    "issueTag": "Subquery in SELECT Clause",
    "description": "A subquery in the SELECT list re-executes for every row instead of being computed once via JOIN.",
    "sql": "SELECT posts.*,\n  (SELECT MAX(created_at) FROM comments WHERE comments.post_id = posts.id) AS last_activity\nFROM posts;"
  },
  {
    "id": "ex045",
    "domain": "Social Media",
    "difficulty": "Intermediate",
    "title": "Function on Indexed Column \u2014 Social Media",
    "issueTag": "Function on Indexed Column",
    "description": "Wrapping a column in YEAR()/MONTH() prevents the index on that column from being used.",
    "sql": "SELECT * FROM followers\nWHERE YEAR(created_at) = 2024 AND MONTH(created_at) = 6;"
  },
  {
    "id": "ex046",
    "domain": "Social Media",
    "difficulty": "Advanced",
    "title": "OR Across Non-Indexed Columns \u2014 Social Media",
    "issueTag": "OR Across Non-Indexed Columns",
    "description": "An OR across two different columns usually can't be satisfied by a single index.",
    "sql": "SELECT * FROM messages\nWHERE body = 'value1' OR body = 'value2';"
  },
  {
    "id": "ex047",
    "domain": "Social Media",
    "difficulty": "Beginner",
    "title": "Unnecessary SELECT DISTINCT \u2014 Social Media",
    "issueTag": "Unnecessary SELECT DISTINCT",
    "description": "DISTINCT forces a sort/hash pass to dedupe rows that are likely already unique from the JOIN.",
    "sql": "SELECT DISTINCT likes.*\nFROM likes\nJOIN posts ON likes.post_id = posts.id;"
  },
  {
    "id": "ex048",
    "domain": "Social Media",
    "difficulty": "Intermediate",
    "title": "Multiple Correlated Subqueries \u2014 Social Media",
    "issueTag": "Multiple Correlated Subqueries",
    "description": "Stacks several N+1 subqueries in one SELECT, compounding the performance hit.",
    "sql": "SELECT posts.id,\n  (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id) AS c1,\n  (SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id) AS c2\nFROM posts\nWHERE posts.id > 0;"
  },
  {
    "id": "ex049",
    "domain": "Social Media",
    "difficulty": "Advanced",
    "title": "NOT IN with Subquery \u2014 Social Media",
    "issueTag": "NOT IN with Subquery",
    "description": "NOT IN silently returns nothing if the subquery contains a single NULL \u2014 use NOT EXISTS instead.",
    "sql": "SELECT * FROM posts\nWHERE id NOT IN (SELECT post_id FROM likes);"
  },
  {
    "id": "ex050",
    "domain": "Social Media",
    "difficulty": "Beginner",
    "title": "Leading Wildcard LIKE \u2014 Social Media",
    "issueTag": "Leading Wildcard LIKE",
    "description": "A LIKE '%text%' pattern can't use an index and forces a full table scan.",
    "sql": "SELECT * FROM likes\nWHERE post_id LIKE '%search%';"
  },
  {
    "id": "ex051",
    "domain": "Social Media",
    "difficulty": "Intermediate",
    "title": "SELECT * with No LIMIT \u2014 Social Media",
    "issueTag": "SELECT * with No LIMIT",
    "description": "Returns every column and every row \u2014 wastes I/O and risks unbounded result sets.",
    "sql": "SELECT * FROM comments\nORDER BY comments.id DESC;"
  },
  {
    "id": "ex052",
    "domain": "Real Estate",
    "difficulty": "Beginner",
    "title": "OR Across Non-Indexed Columns \u2014 Real Estate",
    "issueTag": "OR Across Non-Indexed Columns",
    "description": "An OR across two different columns usually can't be satisfied by a single index.",
    "sql": "SELECT * FROM agents\nWHERE name = 'value1' OR phone = 'value2';"
  },
  {
    "id": "ex053",
    "domain": "Real Estate",
    "difficulty": "Intermediate",
    "title": "Implicit JOIN (Comma) \u2014 Real Estate",
    "issueTag": "Implicit JOIN (Comma)",
    "description": "Comma-style joins block the query planner from reordering joins for the best plan.",
    "sql": "SELECT offers.*, properties.*\nFROM offers, properties\nWHERE offers.property_id = properties.id;"
  },
  {
    "id": "ex054",
    "domain": "Real Estate",
    "difficulty": "Advanced",
    "title": "SELECT * with No LIMIT \u2014 Real Estate",
    "issueTag": "SELECT * with No LIMIT",
    "description": "Returns every column and every row \u2014 wastes I/O and risks unbounded result sets.",
    "sql": "SELECT * FROM properties\nORDER BY properties.id DESC;"
  },
  {
    "id": "ex055",
    "domain": "Real Estate",
    "difficulty": "Beginner",
    "title": "Correlated Subquery (N+1) \u2014 Real Estate",
    "issueTag": "Correlated Subquery (N+1)",
    "description": "Runs a subquery once per outer row instead of using a single JOIN + GROUP BY.",
    "sql": "SELECT properties.id, properties.address,\n  (SELECT COUNT(*) FROM viewings WHERE viewings.property_id = properties.id) AS related_count\nFROM properties;"
  },
  {
    "id": "ex056",
    "domain": "Real Estate",
    "difficulty": "Intermediate",
    "title": "NOT IN with Subquery \u2014 Real Estate",
    "issueTag": "NOT IN with Subquery",
    "description": "NOT IN silently returns nothing if the subquery contains a single NULL \u2014 use NOT EXISTS instead.",
    "sql": "SELECT * FROM agents\nWHERE id NOT IN (SELECT agent_id FROM listings);"
  },
  {
    "id": "ex057",
    "domain": "Real Estate",
    "difficulty": "Advanced",
    "title": "Multiple Correlated Subqueries \u2014 Real Estate",
    "issueTag": "Multiple Correlated Subqueries",
    "description": "Stacks several N+1 subqueries in one SELECT, compounding the performance hit.",
    "sql": "SELECT properties.id,\n  (SELECT COUNT(*) FROM offers WHERE offers.property_id = properties.id) AS c1,\n  (SELECT COUNT(*) FROM viewings WHERE viewings.property_id = properties.id) AS c2\nFROM properties\nWHERE properties.id > 0;"
  },
  {
    "id": "ex058",
    "domain": "Real Estate",
    "difficulty": "Beginner",
    "title": "Unnecessary SELECT DISTINCT \u2014 Real Estate",
    "issueTag": "Unnecessary SELECT DISTINCT",
    "description": "DISTINCT forces a sort/hash pass to dedupe rows that are likely already unique from the JOIN.",
    "sql": "SELECT DISTINCT viewings.*\nFROM viewings\nJOIN properties ON viewings.property_id = properties.id;"
  },
  {
    "id": "ex059",
    "domain": "Real Estate",
    "difficulty": "Intermediate",
    "title": "Subquery in SELECT Clause \u2014 Real Estate",
    "issueTag": "Subquery in SELECT Clause",
    "description": "A subquery in the SELECT list re-executes for every row instead of being computed once via JOIN.",
    "sql": "SELECT properties.*,\n  (SELECT MAX(listed_at) FROM listings WHERE listings.property_id = properties.id) AS last_activity\nFROM properties;"
  },
  {
    "id": "ex060",
    "domain": "Logistics & Shipping",
    "difficulty": "Beginner",
    "title": "SELECT * with No LIMIT \u2014 Logistics & Shipping",
    "issueTag": "SELECT * with No LIMIT",
    "description": "Returns every column and every row \u2014 wastes I/O and risks unbounded result sets.",
    "sql": "SELECT * FROM shipments\nORDER BY shipments.id DESC;"
  },
  {
    "id": "ex061",
    "domain": "Logistics & Shipping",
    "difficulty": "Intermediate",
    "title": "Leading Wildcard LIKE \u2014 Logistics & Shipping",
    "issueTag": "Leading Wildcard LIKE",
    "description": "A LIKE '%text%' pattern can't use an index and forces a full table scan.",
    "sql": "SELECT * FROM warehouses\nWHERE name LIKE '%search%';"
  },
  {
    "id": "ex062",
    "domain": "Logistics & Shipping",
    "difficulty": "Advanced",
    "title": "Function on Indexed Column \u2014 Logistics & Shipping",
    "issueTag": "Function on Indexed Column",
    "description": "Wrapping a column in YEAR()/MONTH() prevents the index on that column from being used.",
    "sql": "SELECT * FROM warehouses\nWHERE YEAR(capacity) = 2024 AND MONTH(capacity) = 6;"
  },
  {
    "id": "ex063",
    "domain": "Logistics & Shipping",
    "difficulty": "Beginner",
    "title": "NOT IN with Subquery \u2014 Logistics & Shipping",
    "issueTag": "NOT IN with Subquery",
    "description": "NOT IN silently returns nothing if the subquery contains a single NULL \u2014 use NOT EXISTS instead.",
    "sql": "SELECT * FROM warehouses\nWHERE id NOT IN (SELECT warehouse_id FROM inventory);"
  },
  {
    "id": "ex064",
    "domain": "Logistics & Shipping",
    "difficulty": "Intermediate",
    "title": "Correlated Subquery (N+1) \u2014 Logistics & Shipping",
    "issueTag": "Correlated Subquery (N+1)",
    "description": "Runs a subquery once per outer row instead of using a single JOIN + GROUP BY.",
    "sql": "SELECT warehouses.id, warehouses.name,\n  (SELECT COUNT(*) FROM inventory WHERE inventory.warehouse_id = warehouses.id) AS related_count\nFROM warehouses;"
  },
  {
    "id": "ex065",
    "domain": "Logistics & Shipping",
    "difficulty": "Advanced",
    "title": "OR Across Non-Indexed Columns \u2014 Logistics & Shipping",
    "issueTag": "OR Across Non-Indexed Columns",
    "description": "An OR across two different columns usually can't be satisfied by a single index.",
    "sql": "SELECT * FROM inventory\nWHERE warehouse_id = 'value1' OR warehouse_id = 'value2';"
  },
  {
    "id": "ex066",
    "domain": "Logistics & Shipping",
    "difficulty": "Beginner",
    "title": "Implicit JOIN (Comma) \u2014 Logistics & Shipping",
    "issueTag": "Implicit JOIN (Comma)",
    "description": "Comma-style joins block the query planner from reordering joins for the best plan.",
    "sql": "SELECT routes.*, drivers.*\nFROM routes, drivers\nWHERE routes.driver_id = drivers.id;"
  },
  {
    "id": "ex067",
    "domain": "Logistics & Shipping",
    "difficulty": "Intermediate",
    "title": "Subquery in SELECT Clause \u2014 Logistics & Shipping",
    "issueTag": "Subquery in SELECT Clause",
    "description": "A subquery in the SELECT list re-executes for every row instead of being computed once via JOIN.",
    "sql": "SELECT warehouses.*,\n  (SELECT MAX(quantity) FROM inventory WHERE inventory.warehouse_id = warehouses.id) AS last_activity\nFROM warehouses;"
  },
  {
    "id": "ex068",
    "domain": "Education",
    "difficulty": "Beginner",
    "title": "Multiple Correlated Subqueries \u2014 Education",
    "issueTag": "Multiple Correlated Subqueries",
    "description": "Stacks several N+1 subqueries in one SELECT, compounding the performance hit.",
    "sql": "SELECT students.id,\n  (SELECT COUNT(*) FROM grades WHERE grades.student_id = students.id) AS c1,\n  (SELECT COUNT(*) FROM enrollments WHERE enrollments.student_id = students.id) AS c2\nFROM students\nWHERE students.id > 0;"
  },
  {
    "id": "ex069",
    "domain": "Education",
    "difficulty": "Intermediate",
    "title": "OR Across Non-Indexed Columns \u2014 Education",
    "issueTag": "OR Across Non-Indexed Columns",
    "description": "An OR across two different columns usually can't be satisfied by a single index.",
    "sql": "SELECT * FROM teachers\nWHERE name = 'value1' OR department = 'value2';"
  },
  {
    "id": "ex070",
    "domain": "Education",
    "difficulty": "Advanced",
    "title": "Implicit JOIN (Comma) \u2014 Education",
    "issueTag": "Implicit JOIN (Comma)",
    "description": "Comma-style joins block the query planner from reordering joins for the best plan.",
    "sql": "SELECT grades.*, students.*\nFROM grades, students\nWHERE grades.student_id = students.id;"
  },
  {
    "id": "ex071",
    "domain": "Education",
    "difficulty": "Beginner",
    "title": "NOT IN with Subquery \u2014 Education",
    "issueTag": "NOT IN with Subquery",
    "description": "NOT IN silently returns nothing if the subquery contains a single NULL \u2014 use NOT EXISTS instead.",
    "sql": "SELECT * FROM courses\nWHERE id NOT IN (SELECT course_id FROM grades);"
  },
  {
    "id": "ex072",
    "domain": "Education",
    "difficulty": "Intermediate",
    "title": "Subquery in SELECT Clause \u2014 Education",
    "issueTag": "Subquery in SELECT Clause",
    "description": "A subquery in the SELECT list re-executes for every row instead of being computed once via JOIN.",
    "sql": "SELECT students.*,\n  (SELECT MAX(semester) FROM enrollments WHERE enrollments.student_id = students.id) AS last_activity\nFROM students;"
  },
  {
    "id": "ex073",
    "domain": "Education",
    "difficulty": "Advanced",
    "title": "SELECT * with No LIMIT \u2014 Education",
    "issueTag": "SELECT * with No LIMIT",
    "description": "Returns every column and every row \u2014 wastes I/O and risks unbounded result sets.",
    "sql": "SELECT * FROM grades\nORDER BY grades.id DESC;"
  },
  {
    "id": "ex074",
    "domain": "Education",
    "difficulty": "Beginner",
    "title": "Unnecessary SELECT DISTINCT \u2014 Education",
    "issueTag": "Unnecessary SELECT DISTINCT",
    "description": "DISTINCT forces a sort/hash pass to dedupe rows that are likely already unique from the JOIN.",
    "sql": "SELECT DISTINCT grades.*\nFROM grades\nJOIN courses ON grades.course_id = courses.id;"
  },
  {
    "id": "ex075",
    "domain": "Education",
    "difficulty": "Intermediate",
    "title": "Leading Wildcard LIKE \u2014 Education",
    "issueTag": "Leading Wildcard LIKE",
    "description": "A LIKE '%text%' pattern can't use an index and forces a full table scan.",
    "sql": "SELECT * FROM grades\nWHERE student_id LIKE '%search%';"
  },
  {
    "id": "ex076",
    "domain": "Gaming",
    "difficulty": "Beginner",
    "title": "Implicit JOIN (Comma) \u2014 Gaming",
    "issueTag": "Implicit JOIN (Comma)",
    "description": "Comma-style joins block the query planner from reordering joins for the best plan.",
    "sql": "SELECT matches.*, players.*\nFROM matches, players\nWHERE matches.player_id = players.id;"
  },
  {
    "id": "ex077",
    "domain": "Gaming",
    "difficulty": "Intermediate",
    "title": "Multiple Correlated Subqueries \u2014 Gaming",
    "issueTag": "Multiple Correlated Subqueries",
    "description": "Stacks several N+1 subqueries in one SELECT, compounding the performance hit.",
    "sql": "SELECT players.id,\n  (SELECT COUNT(*) FROM purchases WHERE purchases.player_id = players.id) AS c1,\n  (SELECT COUNT(*) FROM matches WHERE matches.player_id = players.id) AS c2\nFROM players\nWHERE players.id > 0;"
  },
  {
    "id": "ex078",
    "domain": "Gaming",
    "difficulty": "Advanced",
    "title": "Unnecessary SELECT DISTINCT \u2014 Gaming",
    "issueTag": "Unnecessary SELECT DISTINCT",
    "description": "DISTINCT forces a sort/hash pass to dedupe rows that are likely already unique from the JOIN.",
    "sql": "SELECT DISTINCT matches.*\nFROM matches\nJOIN players ON matches.player_id = players.id;"
  },
  {
    "id": "ex079",
    "domain": "Gaming",
    "difficulty": "Beginner",
    "title": "Subquery in SELECT Clause \u2014 Gaming",
    "issueTag": "Subquery in SELECT Clause",
    "description": "A subquery in the SELECT list re-executes for every row instead of being computed once via JOIN.",
    "sql": "SELECT players.*,\n  (SELECT MAX(purchased_at) FROM purchases WHERE purchases.player_id = players.id) AS last_activity\nFROM players;"
  },
  {
    "id": "ex080",
    "domain": "Gaming",
    "difficulty": "Intermediate",
    "title": "OR Across Non-Indexed Columns \u2014 Gaming",
    "issueTag": "OR Across Non-Indexed Columns",
    "description": "An OR across two different columns usually can't be satisfied by a single index.",
    "sql": "SELECT * FROM leaderboards\nWHERE player_id = 'value1' OR player_id = 'value2';"
  },
  {
    "id": "ex081",
    "domain": "Gaming",
    "difficulty": "Advanced",
    "title": "NOT IN with Subquery \u2014 Gaming",
    "issueTag": "NOT IN with Subquery",
    "description": "NOT IN silently returns nothing if the subquery contains a single NULL \u2014 use NOT EXISTS instead.",
    "sql": "SELECT * FROM players\nWHERE id NOT IN (SELECT player_id FROM purchases);"
  },
  {
    "id": "ex082",
    "domain": "Gaming",
    "difficulty": "Beginner",
    "title": "Correlated Subquery (N+1) \u2014 Gaming",
    "issueTag": "Correlated Subquery (N+1)",
    "description": "Runs a subquery once per outer row instead of using a single JOIN + GROUP BY.",
    "sql": "SELECT players.id, players.username,\n  (SELECT COUNT(*) FROM leaderboards WHERE leaderboards.player_id = players.id) AS related_count\nFROM players;"
  },
  {
    "id": "ex083",
    "domain": "Gaming",
    "difficulty": "Intermediate",
    "title": "Function on Indexed Column \u2014 Gaming",
    "issueTag": "Function on Indexed Column",
    "description": "Wrapping a column in YEAR()/MONTH() prevents the index on that column from being used.",
    "sql": "SELECT * FROM leaderboards\nWHERE YEAR(score) = 2024 AND MONTH(score) = 6;"
  },
  {
    "id": "ex084",
    "domain": "Marketing",
    "difficulty": "Beginner",
    "title": "Function on Indexed Column \u2014 Marketing",
    "issueTag": "Function on Indexed Column",
    "description": "Wrapping a column in YEAR()/MONTH() prevents the index on that column from being used.",
    "sql": "SELECT * FROM leads\nWHERE YEAR(created_at) = 2024 AND MONTH(created_at) = 6;"
  },
  {
    "id": "ex085",
    "domain": "Marketing",
    "difficulty": "Intermediate",
    "title": "Implicit JOIN (Comma) \u2014 Marketing",
    "issueTag": "Implicit JOIN (Comma)",
    "description": "Comma-style joins block the query planner from reordering joins for the best plan.",
    "sql": "SELECT conversions.*, leads.*\nFROM conversions, leads\nWHERE conversions.lead_id = leads.id;"
  },
  {
    "id": "ex086",
    "domain": "Marketing",
    "difficulty": "Advanced",
    "title": "Correlated Subquery (N+1) \u2014 Marketing",
    "issueTag": "Correlated Subquery (N+1)",
    "description": "Runs a subquery once per outer row instead of using a single JOIN + GROUP BY.",
    "sql": "SELECT campaigns.id, campaigns.name,\n  (SELECT COUNT(*) FROM ad_clicks WHERE ad_clicks.campaign_id = campaigns.id) AS related_count\nFROM campaigns;"
  },
  {
    "id": "ex087",
    "domain": "Marketing",
    "difficulty": "Beginner",
    "title": "Multiple Correlated Subqueries \u2014 Marketing",
    "issueTag": "Multiple Correlated Subqueries",
    "description": "Stacks several N+1 subqueries in one SELECT, compounding the performance hit.",
    "sql": "SELECT campaigns.id,\n  (SELECT COUNT(*) FROM leads WHERE leads.campaign_id = campaigns.id) AS c1,\n  (SELECT COUNT(*) FROM email_sends WHERE email_sends.campaign_id = campaigns.id) AS c2\nFROM campaigns\nWHERE campaigns.id > 0;"
  },
  {
    "id": "ex088",
    "domain": "Marketing",
    "difficulty": "Intermediate",
    "title": "SELECT * with No LIMIT \u2014 Marketing",
    "issueTag": "SELECT * with No LIMIT",
    "description": "Returns every column and every row \u2014 wastes I/O and risks unbounded result sets.",
    "sql": "SELECT * FROM ad_clicks\nORDER BY ad_clicks.id DESC;"
  },
  {
    "id": "ex089",
    "domain": "Marketing",
    "difficulty": "Advanced",
    "title": "Leading Wildcard LIKE \u2014 Marketing",
    "issueTag": "Leading Wildcard LIKE",
    "description": "A LIKE '%text%' pattern can't use an index and forces a full table scan.",
    "sql": "SELECT * FROM email_sends\nWHERE opened LIKE '%search%';"
  },
  {
    "id": "ex090",
    "domain": "Marketing",
    "difficulty": "Beginner",
    "title": "OR Across Non-Indexed Columns \u2014 Marketing",
    "issueTag": "OR Across Non-Indexed Columns",
    "description": "An OR across two different columns usually can't be satisfied by a single index.",
    "sql": "SELECT * FROM conversions\nWHERE lead_id = 'value1' OR lead_id = 'value2';"
  },
  {
    "id": "ex091",
    "domain": "Marketing",
    "difficulty": "Intermediate",
    "title": "NOT IN with Subquery \u2014 Marketing",
    "issueTag": "NOT IN with Subquery",
    "description": "NOT IN silently returns nothing if the subquery contains a single NULL \u2014 use NOT EXISTS instead.",
    "sql": "SELECT * FROM campaigns\nWHERE id NOT IN (SELECT campaign_id FROM ad_clicks);"
  },
  {
    "id": "ex092",
    "domain": "Travel & Hospitality",
    "difficulty": "Beginner",
    "title": "Function on Indexed Column \u2014 Travel & Hospitality",
    "issueTag": "Function on Indexed Column",
    "description": "Wrapping a column in YEAR()/MONTH() prevents the index on that column from being used.",
    "sql": "SELECT * FROM guests\nWHERE YEAR(loyalty_tier) = 2024 AND MONTH(loyalty_tier) = 6;"
  },
  {
    "id": "ex093",
    "domain": "Travel & Hospitality",
    "difficulty": "Intermediate",
    "title": "SELECT * with No LIMIT \u2014 Travel & Hospitality",
    "issueTag": "SELECT * with No LIMIT",
    "description": "Returns every column and every row \u2014 wastes I/O and risks unbounded result sets.",
    "sql": "SELECT * FROM flights\nORDER BY flights.id DESC;"
  },
  {
    "id": "ex094",
    "domain": "Travel & Hospitality",
    "difficulty": "Advanced",
    "title": "Implicit JOIN (Comma) \u2014 Travel & Hospitality",
    "issueTag": "Implicit JOIN (Comma)",
    "description": "Comma-style joins block the query planner from reordering joins for the best plan.",
    "sql": "SELECT bookings.*, guests.*\nFROM bookings, guests\nWHERE bookings.guest_id = guests.id;"
  },
  {
    "id": "ex095",
    "domain": "Travel & Hospitality",
    "difficulty": "Beginner",
    "title": "Subquery in SELECT Clause \u2014 Travel & Hospitality",
    "issueTag": "Subquery in SELECT Clause",
    "description": "A subquery in the SELECT list re-executes for every row instead of being computed once via JOIN.",
    "sql": "SELECT guests.*,\n  (SELECT MAX(created_at) FROM reviews WHERE reviews.guest_id = guests.id) AS last_activity\nFROM guests;"
  },
  {
    "id": "ex096",
    "domain": "Travel & Hospitality",
    "difficulty": "Intermediate",
    "title": "Multiple Correlated Subqueries \u2014 Travel & Hospitality",
    "issueTag": "Multiple Correlated Subqueries",
    "description": "Stacks several N+1 subqueries in one SELECT, compounding the performance hit.",
    "sql": "SELECT guests.id,\n  (SELECT COUNT(*) FROM bookings WHERE bookings.guest_id = guests.id) AS c1,\n  (SELECT COUNT(*) FROM reviews WHERE reviews.guest_id = guests.id) AS c2\nFROM guests\nWHERE guests.id > 0;"
  },
  {
    "id": "ex097",
    "domain": "Travel & Hospitality",
    "difficulty": "Advanced",
    "title": "Leading Wildcard LIKE \u2014 Travel & Hospitality",
    "issueTag": "Leading Wildcard LIKE",
    "description": "A LIKE '%text%' pattern can't use an index and forces a full table scan.",
    "sql": "SELECT * FROM hotels\nWHERE city LIKE '%search%';"
  },
  {
    "id": "ex098",
    "domain": "Travel & Hospitality",
    "difficulty": "Beginner",
    "title": "Correlated Subquery (N+1) \u2014 Travel & Hospitality",
    "issueTag": "Correlated Subquery (N+1)",
    "description": "Runs a subquery once per outer row instead of using a single JOIN + GROUP BY.",
    "sql": "SELECT hotels.id, hotels.name,\n  (SELECT COUNT(*) FROM bookings WHERE bookings.hotel_id = hotels.id) AS related_count\nFROM hotels;"
  },
  {
    "id": "ex099",
    "domain": "Travel & Hospitality",
    "difficulty": "Intermediate",
    "title": "Unnecessary SELECT DISTINCT \u2014 Travel & Hospitality",
    "issueTag": "Unnecessary SELECT DISTINCT",
    "description": "DISTINCT forces a sort/hash pass to dedupe rows that are likely already unique from the JOIN.",
    "sql": "SELECT DISTINCT reviews.*\nFROM reviews\nJOIN guests ON reviews.guest_id = guests.id;"
  }
];

export const DOMAINS = Array.from(new Set(SQL_EXAMPLES.map(e => e.domain))).sort();