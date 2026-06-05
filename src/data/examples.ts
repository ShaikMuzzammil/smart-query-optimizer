import type { QueryExample } from '../types';

export const QUERY_EXAMPLES: QueryExample[] = [
  {
    id: 'ex-01',
    title: 'N+1 Join Nightmare',
    description: 'A classic N+1 query joining orders, customers, and products with no indexes — the most common performance killer in production.',
    category: 'joins',
    difficulty: 'intermediate',
    dbType: 'postgresql',
    badge: '🔥 Most Common',
    optimizationGoal: 'speed',
    expectedImprovement: 87,
    tags: ['joins', 'indexes', 'n+1', 'orders'],
    query: `SELECT
  o.id,
  o.created_at,
  o.total_amount,
  o.status,
  c.first_name,
  c.last_name,
  c.email,
  (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count,
  (SELECT SUM(oi2.quantity * p.price)
   FROM order_items oi2
   JOIN products p ON p.id = oi2.product_id
   WHERE oi2.order_id = o.id) AS recalculated_total
FROM orders o
JOIN customers c ON c.id = o.customer_id
WHERE o.status = 'pending'
  AND o.created_at >= NOW() - INTERVAL '30 days'
ORDER BY o.created_at DESC;`,
    schema: `CREATE TABLE customers (
  id          BIGSERIAL PRIMARY KEY,
  first_name  VARCHAR(100),
  last_name   VARCHAR(100),
  email       VARCHAR(200) UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE orders (
  id           BIGSERIAL PRIMARY KEY,
  customer_id  BIGINT REFERENCES customers(id),
  status       VARCHAR(50) NOT NULL DEFAULT 'pending',
  total_amount NUMERIC(12,2),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE order_items (
  id         BIGSERIAL PRIMARY KEY,
  order_id   BIGINT REFERENCES orders(id),
  product_id BIGINT NOT NULL,
  quantity   INT NOT NULL,
  price      NUMERIC(10,2) NOT NULL
);
CREATE TABLE products (
  id    BIGSERIAL PRIMARY KEY,
  name  VARCHAR(200),
  price NUMERIC(10,2)
);`,
  },
  {
    id: 'ex-02',
    title: 'Aggregation Without Indexes',
    description: 'Monthly revenue report scanning millions of rows with no covering indexes. This kills dashboards at scale.',
    category: 'aggregation',
    difficulty: 'intermediate',
    dbType: 'postgresql',
    badge: '📊 Analytics',
    optimizationGoal: 'cost',
    expectedImprovement: 74,
    tags: ['aggregation', 'group by', 'analytics', 'revenue'],
    query: `SELECT
  DATE_TRUNC('month', created_at) AS month,
  status,
  COUNT(*) AS order_count,
  SUM(total_amount) AS revenue,
  AVG(total_amount) AS avg_order_value,
  COUNT(DISTINCT customer_id) AS unique_customers
FROM orders
WHERE created_at BETWEEN '2023-01-01' AND '2024-01-01'
  AND status NOT IN ('cancelled', 'refunded')
GROUP BY 1, 2
ORDER BY 1 DESC, revenue DESC;`,
    schema: `CREATE TABLE orders (
  id           BIGSERIAL PRIMARY KEY,
  customer_id  BIGINT NOT NULL,
  status       VARCHAR(50) NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);`,
  },
  {
    id: 'ex-03',
    title: 'Deep Nested Subqueries',
    description: 'Three levels of nested subqueries that are evaluated row-by-row. A textbook refactor opportunity using CTEs.',
    category: 'subquery',
    difficulty: 'advanced',
    dbType: 'postgresql',
    badge: '🧬 Complex',
    optimizationGoal: 'readability',
    expectedImprovement: 65,
    tags: ['subquery', 'cte', 'refactor', 'nested'],
    query: `SELECT
  u.id,
  u.username,
  u.email,
  (SELECT COUNT(*) FROM posts p WHERE p.user_id = u.id AND p.status = 'published') AS post_count,
  (SELECT MAX(p2.created_at) FROM posts p2 WHERE p2.user_id = u.id) AS last_post_date,
  (SELECT COUNT(*) FROM comments c
   WHERE c.post_id IN (
     SELECT id FROM posts p3
     WHERE p3.user_id = u.id
   )
   AND c.created_at >= NOW() - INTERVAL '7 days'
  ) AS recent_comment_count
FROM users u
WHERE u.created_at >= '2023-01-01'
  AND u.is_active = true
  AND (SELECT COUNT(*) FROM posts p4 WHERE p4.user_id = u.id) > 0
ORDER BY post_count DESC
LIMIT 50;`,
    schema: `CREATE TABLE users (
  id         BIGSERIAL PRIMARY KEY,
  username   VARCHAR(100) UNIQUE NOT NULL,
  email      VARCHAR(200) UNIQUE NOT NULL,
  is_active  BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE posts (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT REFERENCES users(id),
  title      VARCHAR(500),
  status     VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE comments (
  id         BIGSERIAL PRIMARY KEY,
  post_id    BIGINT REFERENCES posts(id),
  user_id    BIGINT REFERENCES users(id),
  content    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`,
  },
  {
    id: 'ex-04',
    title: 'Missing Composite Index',
    description: 'An e-commerce product search running a sequential scan on 10M rows. One composite index changes everything.',
    category: 'indexing',
    difficulty: 'beginner',
    dbType: 'mysql',
    badge: '⚡ Quick Win',
    optimizationGoal: 'speed',
    expectedImprovement: 92,
    tags: ['index', 'mysql', 'search', 'ecommerce'],
    query: `SELECT
  p.id,
  p.name,
  p.price,
  p.stock_quantity,
  c.name AS category_name,
  b.name AS brand_name
FROM products p
JOIN categories c ON c.id = p.category_id
JOIN brands b ON b.id = p.brand_id
WHERE p.is_active = 1
  AND p.category_id = 42
  AND p.price BETWEEN 10.00 AND 500.00
  AND p.stock_quantity > 0
ORDER BY p.price ASC, p.created_at DESC
LIMIT 20 OFFSET 0;`,
    schema: `CREATE TABLE products (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  category_id    INT NOT NULL,
  brand_id       INT NOT NULL,
  name           VARCHAR(300) NOT NULL,
  price          DECIMAL(10,2) NOT NULL,
  stock_quantity INT NOT NULL DEFAULT 0,
  is_active      TINYINT(1) NOT NULL DEFAULT 1,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);`,
  },
  {
    id: 'ex-05',
    title: 'Window Function Refactor',
    description: 'A rank-and-filter pattern using a self-join instead of window functions — 10× slower than it needs to be.',
    category: 'advanced',
    difficulty: 'expert',
    dbType: 'postgresql',
    badge: '🏆 Expert',
    optimizationGoal: 'balanced',
    expectedImprovement: 78,
    tags: ['window functions', 'rank', 'self-join', 'refactor'],
    query: `SELECT
  e.id,
  e.name,
  e.department_id,
  e.salary,
  d.name AS department_name
FROM employees e
JOIN departments d ON d.id = e.department_id
WHERE e.salary = (
  SELECT MAX(e2.salary)
  FROM employees e2
  WHERE e2.department_id = e.department_id
)
AND e.is_active = true
ORDER BY e.department_id, e.salary DESC;`,
    schema: `CREATE TABLE departments (
  id   BIGSERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL
);
CREATE TABLE employees (
  id            BIGSERIAL PRIMARY KEY,
  department_id BIGINT REFERENCES departments(id),
  name          VARCHAR(200) NOT NULL,
  salary        NUMERIC(12,2) NOT NULL,
  is_active     BOOLEAN DEFAULT true,
  hired_at      DATE
);`,
  },
  {
    id: 'ex-06',
    title: 'Slow LIKE Search',
    description: 'Full-text search using LIKE wildcards — leading wildcard prevents any index usage. Switch to full-text or trigram.',
    category: 'performance',
    difficulty: 'intermediate',
    dbType: 'postgresql',
    badge: '🔍 Search',
    optimizationGoal: 'speed',
    expectedImprovement: 83,
    tags: ['like', 'full-text search', 'trigram', 'ilike'],
    query: `SELECT
  id,
  title,
  body,
  author_id,
  created_at,
  view_count
FROM articles
WHERE (title ILIKE '%javascript%' OR body ILIKE '%javascript%')
  AND is_published = true
  AND created_at >= NOW() - INTERVAL '1 year'
ORDER BY view_count DESC
LIMIT 20;`,
    schema: `CREATE TABLE articles (
  id           BIGSERIAL PRIMARY KEY,
  author_id    BIGINT NOT NULL,
  title        VARCHAR(500) NOT NULL,
  body         TEXT NOT NULL,
  is_published BOOLEAN DEFAULT false,
  view_count   BIGINT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);`,
  },
  {
    id: 'ex-07',
    title: 'Pagination Anti-Pattern',
    description: 'Deep offset pagination scanning millions of rows to skip. Cursor-based pagination is orders of magnitude faster.',
    category: 'performance',
    difficulty: 'intermediate',
    dbType: 'postgresql',
    badge: '📄 Pagination',
    optimizationGoal: 'cost',
    expectedImprovement: 71,
    tags: ['pagination', 'offset', 'cursor', 'limit'],
    query: `SELECT
  id,
  user_id,
  action_type,
  metadata,
  ip_address,
  created_at
FROM audit_logs
WHERE user_id = 12345
  AND created_at >= '2023-01-01'
ORDER BY created_at DESC
LIMIT 20 OFFSET 50000;`,
    schema: `CREATE TABLE audit_logs (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL,
  action_type VARCHAR(100) NOT NULL,
  metadata    JSONB,
  ip_address  INET,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);`,
  },
  {
    id: 'ex-08',
    title: 'SQL Server Execution Plan Fix',
    description: 'A date function in the WHERE clause preventing index use in SQL Server. Classic sargability issue.',
    category: 'performance',
    difficulty: 'advanced',
    dbType: 'sqlserver',
    badge: '🖥️ SQL Server',
    optimizationGoal: 'speed',
    expectedImprovement: 68,
    tags: ['sql server', 'sargability', 'date function', 'index'],
    query: `SELECT
  s.SaleID,
  s.CustomerID,
  s.Amount,
  s.SaleDate,
  c.CustomerName,
  c.Region
FROM Sales s
INNER JOIN Customers c ON c.CustomerID = s.CustomerID
WHERE YEAR(s.SaleDate) = 2023
  AND MONTH(s.SaleDate) = 6
  AND c.Region = 'North'
ORDER BY s.Amount DESC;`,
    schema: `CREATE TABLE Sales (
  SaleID     INT IDENTITY PRIMARY KEY,
  CustomerID INT NOT NULL,
  Amount     DECIMAL(12,2) NOT NULL,
  SaleDate   DATETIME NOT NULL,
  ProductID  INT NOT NULL
);
CREATE TABLE Customers (
  CustomerID   INT IDENTITY PRIMARY KEY,
  CustomerName NVARCHAR(200) NOT NULL,
  Region       NVARCHAR(100)
);`,
  },
];

export const EXAMPLE_CATEGORIES = [
  { id: 'all',         label: 'All Examples',   count: QUERY_EXAMPLES.length },
  { id: 'performance', label: 'Performance',    count: QUERY_EXAMPLES.filter(e => e.category === 'performance').length },
  { id: 'joins',       label: 'Joins',          count: QUERY_EXAMPLES.filter(e => e.category === 'joins').length },
  { id: 'aggregation', label: 'Aggregation',    count: QUERY_EXAMPLES.filter(e => e.category === 'aggregation').length },
  { id: 'subquery',    label: 'Subqueries',     count: QUERY_EXAMPLES.filter(e => e.category === 'subquery').length },
  { id: 'indexing',    label: 'Indexing',       count: QUERY_EXAMPLES.filter(e => e.category === 'indexing').length },
  { id: 'advanced',    label: 'Advanced',       count: QUERY_EXAMPLES.filter(e => e.category === 'advanced').length },
];
