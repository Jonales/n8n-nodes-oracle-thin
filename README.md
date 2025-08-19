# n8n-nodes-oracle-thin

![LOGOTIPO](image/README/oracle-n8n.png)

[![npm version](https://img.shields.io/npm/v/n8n-nodes-oracle-thin.svg)](https://www.npmjs.com/package/n8n-nodes-oracle-thin)
[![npm downloads](https://img.shields.io/npm/dt/n8n-nodes-oracle-thin.svg)](https://www.npmjs.com/package/n8n-nodes-oracle-thin)

---

<details>
<summary>🇺🇸 English</summary>

---

# 📖 Documentation in English

Advanced [Oracle Database](https://docs.oracle.com/en/database/oracle/oracle-database/) node for **n8n**, with **enterprise features for heavy workloads and Oracle 19c+**.

> **🚀 Version 1.1.0-rc.1 - Revolutionary**  
> This package **does not require** manual installation of **Oracle Instant Client** or Oracle CLI.  
> All necessary client components are embedded through the thin mode of `oracledb` 6.x, working transparently on **Windows, Linux, macOS, Docker, and serverless environments**, without additional configuration.

---

## 📋 About This Project

**Developed by:** [Jônatas Meireles Sousa Vieira](https://github.com/jonales)

---

## ⭐ Revolutionary Features

### **🔧 Zero External Configuration**

- ✅ **No Oracle Instant Client** - Embedded thin client
- ✅ **No environment variables** - `LD_LIBRARY_PATH` unnecessary
- ✅ **Universal compatibility** - Works in any Node.js environment
- ✅ **Simplified deployment** - Just `npm install` and use

### **🚀 Advanced Enterprise Features**

- ✅ **Intelligent Connection Pooling** for heavy workloads
- ✅ **Bulk Operations** - Mass Insert/Update/Delete/Upsert
- ✅ **PL/SQL Executor** - Anonymous blocks, procedures and functions
- ✅ **Transaction Manager** - Complex transactions with savepoints
- ✅ **Oracle Advanced Queuing (AQ)** - Messaging system
- ✅ **Automatic retry** for critical operations
- ✅ **Advanced debug mode** for troubleshooting

### **🏗️ Supported Operation Types**

1. **SQL Query** - Traditional queries with bind variables
2. **PL/SQL Block** - Anonymous blocks with automatic OUT parameter detection
3. **Stored Procedure** - Execution with automatic metadata
4. **Function** - Calls with configurable return type
5. **Bulk Operations** - Optimized mass operations
6. **Transaction Block** - Distributed transactions with full control
7. **Oracle AQ** - Advanced enterprise messaging

---

## 🚀 Installation

```bash
npm install n8n-nodes-oracle-thin
```

> 💡 **No need** to install Oracle Instant Client, configure `LD_LIBRARY_PATH` or any external dependencies.

---

## ⚙️ Configuration in n8n

### 1. Configure Oracle Credentials

In n8n, add credentials of type **Oracle Credentials**:

| Field                 | Description                                          | Example                 |
| --------------------- | ---------------------------------------------------- | ----------------------- |
| **User**              | Database username                                    | `system` or `hr`        |
| **Password**          | User password                                        | `your_password_here`    |
| **Connection String** | Connection string in format `host:port/service_name` | `localhost:1521/XEPDB1` |

#### Connection String Examples:

```bash
# Local Oracle XE database
localhost:1521/XEPDB1

# Oracle Enterprise server
oracle.company.com:1521/PROD

# Oracle Cloud (Autonomous Database)
adb.sa-saopaulo-1.oraclecloud.com:1522/g4c12345_dbname_high.adb.oraclecloud.com

# Oracle RDS (AWS)
oracle-rds.cluster-xyz.us-east-1.rds.amazonaws.com:1521/ORCL
```

### 2. Use the Node in Your Workflow

Add the **Oracle Database Advanced** node to your workflow and configure according to your needs.

---

## 💡 Practical Examples

### Simple SQL Query

```sql
SELECT customer_id, name, email, created_date
FROM customers
WHERE status = :status
AND created_date > :start_date
ORDER BY created_date DESC
```

**Parameters:**

- `status` (String): `"ACTIVE"`
- `start_date` (Date): `"2024-01-01"`

### Advanced PL/SQL Block

```sql
BEGIN
    -- Process orders in batch
    FOR order_rec IN (
        SELECT order_id, customer_id, total_amount
        FROM orders
        WHERE status = 'PENDING'
    ) LOOP
        -- Validate order
        validate_order(order_rec.order_id);

        -- Process payment
        process_payment(order_rec.customer_id, order_rec.total_amount);

        -- Update status
        UPDATE orders
        SET status = 'PROCESSED', processed_date = SYSDATE
        WHERE order_id = order_rec.order_id;
    END LOOP;

    :processed_count := SQL%ROWCOUNT;
    COMMIT;
END;
```

### Bulk Operations (100k records)

```
Operation Type: "Bulk Operations"
Connection Pool: "High Volume Pool"
Bulk Operation: "Bulk Insert"
Table Name: "customer_data"
Batch Size: 5000
Continue on Error: true
```

### Complex Transaction with Savepoints

```sql
-- Multiple operations in one transaction
INSERT INTO orders (customer_id, product_id, quantity)
VALUES (:customer_id, :product_id, :quantity);

UPDATE inventory
SET stock_quantity = stock_quantity - :quantity
WHERE product_id = :product_id;

DELETE FROM cart_items
WHERE customer_id = :customer_id AND product_id = :product_id;
```

### Oracle Advanced Queuing

```
// Send message to queue
Operation Type: "Oracle AQ"
Queue Operation: "Enqueue Message"
Queue Name: "ORDER_PROCESSING_QUEUE"
Message Payload: {"orderId": 12345, "priority": "HIGH"}
Message Priority: 1
```

---

## 🏊 Intelligent Connection Pools

### **Standard Pool** (Default)

- **Usage:** Balanced applications
- **Connections:** 2-20 (increment 2)
- **Timeout:** 60s

### **High Volume Pool**

- **Usage:** Mass operations (millions of records)
- **Connections:** 5-50 (increment 5)
- **Batch Size:** 5,000 records
- **Timeout:** 120s

### **OLTP Pool**

- **Usage:** Many small and fast transactions
- **Connections:** 10-100 (increment 10)
- **Optimization:** Statement caching
- **Timeout:** 30s

### **Analytics Pool**

- **Usage:** Long queries and reports
- **Connections:** 2-10 (increment 1)
- **Timeout:** 300s (5 minutes)

---

## 📊 Performance and Scalability

### **Tested Benchmarks**

- ✅ **1 million records** inserted in < 3 minutes
- ✅ **Complex queries** with 50+ JOINs executed efficiently
- ✅ **Distributed transactions** with 100+ operations
- ✅ **AQ messaging** processing 10k+ messages/minute
- ✅ **PL/SQL blocks** with loops of millions of iterations

### **Implemented Optimizations**

- **Automatic statement caching**
- **Array DML** for mass operations
- **Intelligent connection pooling**
- **Automatic retry** for deadlocks
- **Streaming** for large LOBs
- **Configurable batch processing**

---

## 🗃️ Full Compatibility

### **Oracle Database Versions**

- ✅ **Oracle Database 12.1+** (all versions)
- ✅ **Oracle Database 18c, 19c, 21c, 23c**
- ✅ **Oracle Autonomous Database** (OCI)
- ✅ **Oracle Express Edition (XE)**
- ✅ **Oracle Standard/Enterprise Edition**
- ✅ **Oracle RDS** (AWS)
- ✅ **Oracle Cloud Infrastructure**

### **Deployment Environments**

- ✅ **Windows** (10, 11, Server 2016+)
- ✅ **Linux** (Ubuntu, CentOS, RHEL, Alpine, Amazon Linux)
- ✅ **macOS** (Intel and Apple Silicon M1/M2)
- ✅ **Docker containers** (any base image)
- ✅ **Kubernetes** (all orchestrators)
- ✅ **Serverless** (AWS Lambda, Azure Functions, Google Cloud Functions)
- ✅ **CI/CD** (GitHub Actions, GitLab CI, Jenkins)

### **Node.js Versions**

- ✅ **Node.js 18.x** (minimum)
- ✅ **Node.js 20.x, 22.x** (recommended)
- ✅ **Node.js 23.x** (latest)

---

## 🔐 Enterprise Security

### **Mandatory Bind Variables**

- **Complete protection** against SQL Injection
- **Optimized performance** with statement caching
- **Secure logs** without sensitive data exposure

### **Connection Security**

- **SSL/TLS** natively supported
- **Oracle Wallet** compatible
- **Kerberos authentication** supported
- **Proxy authentication** available

### **Audit and Compliance**

- **Detailed logs** of all operations
- **Transaction tracking** with correlation ID
- **Integrated performance metrics**
- **Robust error handling** with stack traces

---

## 🆘 Troubleshooting

### **Error: ORA-12541 (TNS:no listener)**

```
Cause: Oracle service is not running or incorrect connection string
Solution:
1. Check if Oracle is active: lsnrctl status
2. Confirm host:port/service_name in connection string
3. Test connectivity: telnet host port
```

### **Error: ORA-01017 (invalid username/password)**

```
Cause: Incorrect credentials or locked user
Solution:
1. Verify username and password
2. Confirm account is not expired: ALTER USER user IDENTIFIED BY password;
3. Check permissions: GRANT CONNECT, RESOURCE TO user;
```

### **Error: Pool timeout**

```
Cause: Too many connections in use or saturated pool
Solution:
1. Increase poolMax in settings
2. Verify connections are being closed properly
3. Use appropriate pool (OLTP for many small transactions)
```

### **Slow Performance in Bulk Operations**

```
Optimizations:
1. Increase batchSize to 5000-10000
2. Use High Volume Pool
3. Disable autoCommit and do manual commits
4. Check indexes on target tables
```

---

## 🧪 Development and Testing

### **Development Environment Setup**

```bash
# Clone repository
git clone https://github.com/jonales/n8n-nodes-oracle-thin.git
cd n8n-nodes-oracle-thin

# Install dependencies
npm install

# Build project
npm run build

# Run tests
npm test

# Development mode (watch)
npm run dev
```

### **Test Locally Before Publishing**

```bash
# In package directory
npm run build
npm link

# In your n8n directory
npm link n8n-nodes-oracle-thin

# Start n8n and test features
# ...

# When finished testing
npm unlink n8n-nodes-oracle-thin
```

### **Available Scripts**

```bash
npm run clean              # Clean dist and cache
npm run build              # Compile TypeScript + copy icons
npm run build:watch        # Build in watch mode
npm run build:assets       # Copy only assets (icons)
npm run dev                # Development mode (watch)
npm run lint               # Check code with ESLint
npm run lint:fix           # Fix ESLint issues automatically
npm run format             # Format code with Prettier
npm run format:check       # Check formatting without changes
npm run type-check         # Check TypeScript types
npm test                   # Run automated tests
npm test:watch             # Tests in watch mode
npm test:coverage          # Tests with coverage report
npm run validate           # Run type-check + lint + test
npm run prepublishOnly     # Checks before publishing
npm run release            # Publish with semantic-release
```

---

## 🤝 Contributing

Contributions are **very welcome**! This is an open source project and your collaboration is fundamental to making it even better.

### **How to Contribute**

1. **Fork** the repository
2. **Create a branch** for your feature: `git checkout -b feature/new-functionality`
3. **Make your changes** and add tests if necessary
4. **Commit** your changes: `git commit -m 'feat: adds new functionality'`
5. **Push** to the branch: `git push origin feature/new-functionality`
6. **Open a Pull Request** with detailed description

### **Types of Contribution**

- 🐛 **Bug fixes** - Corrections of identified issues
- ⚡ **Performance** - Speed and memory optimizations
- 📚 **Documentation** - Improvements in documentation and examples
- ✨ **Features** - New functionalities and resources
- 🧪 **Tests** - Addition of automated tests
- 🔧 **Refactoring** - Improvements in code structure

### **💰 Support the Project**

If this project helped you, consider making a contribution via **PIX** to support its continuous development:

<div align="center">

### PIX:

<img src="image/README/qrcode-pix-jonatas.mei@outlook.com.png" alt="QR Code PIX" width="150" />

**PIX Key:** jonatas.mei@outlook.com

### Cryptocurrency Donation

<table style="width:100%; border:none;">
  <tr style="border:none;">
    <td style="text-align:center; padding:10px; border:none;">
      <h4>Bitcoin (BTC)</h4>
      <img src="image/README/btc.jpeg" alt="QR Code BTC" width="150" />
      <br>
      <code>bc1qdq9rj7565c4fvr7t3xut6z0tjd65p4mudrc0ll</code>
      <br>
      <a href="https://link.trustwallet.com/send?asset=c0&address=bc1qdq9rj7565c4fvr7t3xut6z0tjd65p4mudrc0ll">Pay with Trust Wallet</a>
    </td>
    <td style="text-align:center; padding:10px; border:none;">
      <h4>Ethereum (ETH)</h4>
      <img src="image/README/eth.jpeg" alt="QR Code ETH" width="150" />
      <br>
      <code>0xA35A984401Ae9c81ca2d742977E603421df45419</code>
      <br>
      <a href="https://link.trustwallet.com/send?address=0xA35A984401Ae9c81ca2d742977E603421df45419&asset=c60">Pay with Trust Wallet</a>
    </td>
  </tr>
  <tr style="border:none;">
    <td style="text-align:center; padding:10px; border:none;">
      <h4>Binance (BNB)</h4>
      <img src="image/README/bnb.jpeg" alt="QR Code BNB" width="150" />
      <br>
      <code>0xA35A984401Ae9c81ca2d742977E603421df45419</code>
      <br>
      <a href="https://link.trustwallet.com/send?address=0xA35A984401Ae9c81ca2d742977E603421df45419&asset=c20000714">Pay with Trust Wallet</a>
    </td>
    <td style="text-align:center; padding:10px; border:none;">
      <h4>Polygon (POL)</h4>
      <img src="image/README/pol.jpeg" alt="QR Code POL" width="150" />
      <br>
      <code>0xA35A984401Ae9c81ca2d742977E603421df45419</code>
      <br>
      <a href="https://link.trustwallet.com/send?asset=c966&address=0xA35A984401Ae9c81ca2d742977E603421df45419">Pay with Trust Wallet</a>
    </td>
  </tr>
</table>

</div>

**Why contribute financially?**

- ⏰ **More time** dedicated to developing new features
- 🛠️ **Proactive maintenance** with quick fixes
- 📖 **Documentation** increasingly complete and educational
- 🧪 **Testing** on different Oracle versions and environments
- 💬 **Support** faster issue resolution

Every contribution, no matter how small, makes a difference and is greatly appreciated! 🙏

---

## 📦 Technical Dependencies

### **Runtime Dependencies**

```json
{
	"oracledb": "^6.9.0" // Oracle client with native thin mode
}
```

### **Development Dependencies**

```json
{
	"typescript": "^5.7.2", // TypeScript compiler
	"eslint": "^9.33.0", // Code linter
	"prettier": "^3.3.3", // Code formatter
	"@eslint/js": "^9.33.0", // ESLint flat config support
	"@typescript-eslint/eslint-plugin": "^8.39.1", // TypeScript ESLint rules
	"@typescript-eslint/parser": "^8.39.1", // TypeScript ESLint parser
	"eslint-config-prettier": "^9.1.0", // Turns off ESLint rules that conflict with Prettier
	"eslint-plugin-prettier": "^5.2.1", // Runs Prettier as an ESLint rule
	"eslint-plugin-import": "^2.31.0", // Linting for ES6+ import/export syntax
	"eslint-plugin-n8n-nodes-base": "^1.16.3", // ESLint rules for n8n community nodes
	"prettier-plugin-organize-imports": "^3.2.4", // Organize imports automatically
	"jest": "^29.7.0", // Testing framework
	"ts-jest": "^29.2.5", // Jest transformer for TypeScript
	"@types/jest": "^29.5.14", // TypeScript types for Jest
	"gulp": "^5.0.0", // Build automation
	"del": "^7.1.0", // File deletion for gulp tasks
	"rimraf": "^6.0.1", // Cross-platform `rm -rf`
	"husky": "^9.1.7", // Git hooks
	"lint-staged": "^15.2.10", // Run linters on staged git files
	"semantic-release": "^24.2.0", // Automated releases
	"@semantic-release/changelog": "^6.0.3", // Plugin for changelog generation
	"@semantic-release/git": "^10.0.1", // Commit version updates
	"@semantic-release/github": "^10.3.5", // GitHub releases integration
	"@semantic-release/npm": "^12.0.1", // Publishes to npm
	"@types/node": "^22.10.1", // TypeScript types for Node.js
	"n8n-workflow": "^1.105.0" // Types used in n8n custom nodes
}
```

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE.md](LICENSE.md) file for details.

```
MIT License

Copyright (c) 2025 Jônatas Meireles Sousa Vieira

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 👨‍💻 Author

**Jônatas Meireles Sousa Vieira**  
📧 [jonatas.mei@outlook.com](mailto:jonatas.mei@outlook.com)  
🔗 [GitHub: @jonales](https://github.com/jonales)  
🌐 [LinkedIn](https://www.linkedin.com/in/jonatasmeireles/)

---

## 🌟 Acknowledgments

- **Oracle Corporation** - For the excellent `node-oracledb` library
- **n8n Community** - For making automation accessible to everyone
- **Contributors** - Everyone who helps improve this project

---

## 📚 Useful Links

- [📖 Oracle Database Documentation](https://docs.oracle.com/en/database/oracle/oracle-database/)
- [🔧 n8n Community Nodes](https://docs.n8n.io/integrations/community-nodes/)
- [📚 Oracle node-oracledb Documentation](https://node-oracledb.readthedocs.io/)
- [🐛 Report Issues](https://github.com/jonales/n8n-nodes-oracle-thin/issues)
- [💬 Discussions](https://github.com/jonales/n8n-nodes-oracle-thin/discussions)

---

<div align="center">

**⭐ If this project was helpful, consider giving it a star on GitHub! ⭐**

[![GitHub stars](https://img.shields.io/github/stars/jonales/n8n-nodes-oracle-thin.svg?style=social&label=Star)](https://github.com/jonales/n8n-nodes-oracle-thin)
[![GitHub forks](https://img.shields.io/github/forks/jonales/n8n-nodes-oracle-thin.svg?style=social&label=Fork)](https://github.com/jonales/n8n-nodes-oracle-thin/fork)

Made with ❤️ for the Oracle and n8n communities

</div>

</details>

<details close>
<summary>🇧🇷 Português</summary>

---

# 📖 Documentação em Português

[Oracle Database](https://docs.oracle.com/en/database/oracle/oracle-database/) node avançado para **n8n**, com **recursos empresariais para cargas pesadas e Oracle 19c+**.

> **🚀 Versão 1.1.0-rc.1 - Revolucionário**  
> Este pacote **não requer** instalação manual do **Oracle Instant Client** ou Oracle CLI.  
> Todo o cliente necessário está embutido através do thin mode do `oracledb` 6.x, funcionando de forma transparente em **Windows, Linux, macOS, Docker e ambientes serverless**, sem configuração adicional.

## 📋 Sobre este projeto

**Desenvolvido por:** [Jônatas Meireles Sousa Vieira](https://github.com/jonales)

---

## ⭐ Recursos Revolucionários

### **🔧 Zero Configuração Externa**

- ✅ **Sem Oracle Instant Client** - Cliente thin embutido
- ✅ **Sem variáveis de ambiente** - `LD_LIBRARY_PATH` desnecessário
- ✅ **Compatibilidade universal** - Funciona em qualquer ambiente Node.js
- ✅ **Deploy simplificado** - Apenas `npm install` e usar

### **🚀 Recursos Empresariais Avançados**

- ✅ **Connection Pooling** inteligente para cargas pesadas
- ✅ **Bulk Operations** - Insert/Update/Delete/Upsert em massa
- ✅ **PL/SQL Executor** - Blocos anônimos, procedures e functions
- ✅ **Transaction Manager** - Transações complexas com savepoints
- ✅ **Oracle Advanced Queuing (AQ)** - Sistema de mensageria
- ✅ **Retry automático** para operações críticas
- ✅ **Debug mode** avançado para troubleshooting

### **🏗️ Tipos de Operação Suportados**

1. **SQL Query** - Consultas tradicionais com bind variables
2. **PL/SQL Block** - Blocos anônimos com detecção automática de OUT parameters
3. **Stored Procedure** - Execução com metadados automáticos
4. **Function** - Chamadas com tipo de retorno configurável
5. **Bulk Operations** - Operações em massa otimizadas
6. **Transaction Block** - Transações distribuídas com controle total
7. **Oracle AQ** - Mensageria empresarial avançada

---

## 🚀 Instalação

```

npm install n8n-nodes-oracle-thin

```

> 💡 **Não é necessário** instalar Oracle Instant Client, configurar `LD_LIBRARY_PATH` ou qualquer dependência externa.

---

## ⚙️ Configuração no n8n

### 1. Configurar credenciais Oracle

No n8n, adicione credenciais do tipo **Oracle Credentials**:

| Campo                 | Descrição                                             | Exemplo                 |
| --------------------- | ----------------------------------------------------- | ----------------------- |
| **User**              | Usuário do banco de dados                             | `system` ou `hr`        |
| **Password**          | Senha do usuário                                      | `sua_senha_aqui`        |
| **Connection String** | String de conexão no formato `host:port/service_name` | `localhost:1521/XEPDB1` |

#### Exemplos de Connection String:

```


# Banco local Oracle XE

localhost:1521/XEPDB1

# Servidor Oracle Enterprise

oracle.empresa.com:1521/PROD

# Oracle Cloud (Autonomous Database)

adb.sa-saopaulo-1.oraclecloud.com:1522/g4c12345_dbname_high.adb.oraclecloud.com

# Oracle RDS (AWS)

oracle-rds.cluster-xyz.us-east-1.rds.amazonaws.com:1521/ORCL

```

### 2. Usar o node no workflow

Adicione o node **Oracle Database Advanced** ao seu workflow e configure conforme sua necessidade.

---

## 💡 Exemplos Práticos

### Consulta SQL Simples

```sql

SELECT customer_id, name, email, created_date
FROM customers
WHERE status = :status
AND created_date > :start_date
ORDER BY created_date DESC

```

**Parâmetros:**

- `status` (String): `"ACTIVE"`
- `start_date` (Date): `"2024-01-01"`

### PL/SQL Block Avançado

```sql

BEGIN
-- Processar pedidos em lote
FOR order_rec IN (
SELECT order_id, customer_id, total_amount
FROM orders
WHERE status = 'PENDING'
) LOOP
-- Validar pedido
validate_order(order_rec.order_id);

        -- Processar pagamento
        process_payment(order_rec.customer_id, order_rec.total_amount);

        -- Atualizar status
        UPDATE orders
        SET status = 'PROCESSED', processed_date = SYSDATE
        WHERE order_id = order_rec.order_id;
    END LOOP;

    :processed_count := SQL%ROWCOUNT;
    COMMIT;
    END;

```

### Bulk Operations (100k registros)

```

Operation Type: "Bulk Operations"
Connection Pool: "High Volume Pool"
Bulk Operation: "Bulk Insert"
Table Name: "customer_data"
Batch Size: 5000
Continue on Error: true

```

### Transação Complexa com Savepoints

```sql

-- Múltiplas operações em uma transação
INSERT INTO orders (customer_id, product_id, quantity)
VALUES (:customer_id, :product_id, :quantity);

UPDATE inventory
SET stock_quantity = stock_quantity - :quantity
WHERE product_id = :product_id;

DELETE FROM cart_items
WHERE customer_id = :customer_id AND product_id = :product_id;

```

### Oracle Advanced Queuing

```

// Enviar mensagem para fila
Operation Type: "Oracle AQ"
Queue Operation: "Enqueue Message"
Queue Name: "ORDER_PROCESSING_QUEUE"
Message Payload: {"orderId": 12345, "priority": "HIGH"}
Message Priority: 1

```

---

## 🏊 Pools de Conexão Inteligentes

### **Standard Pool** (Padrão)

- **Uso:** Aplicações balanceadas
- **Conexões:** 2-20 (incremento 2)
- **Timeout:** 60s

### **High Volume Pool**

- **Uso:** Operações em massa (milhões de registros)
- **Conexões:** 5-50 (incremento 5)
- **Batch Size:** 5.000 registros
- **Timeout:** 120s

### **OLTP Pool**

- **Uso:** Muitas transações pequenas e rápidas
- **Conexões:** 10-100 (incremento 10)
- **Otimização:** Cache de statements
- **Timeout:** 30s

### **Analytics Pool**

- **Uso:** Consultas longas e relatórios
- **Conexões:** 2-10 (incremento 1)
- **Timeout:** 300s (5 minutos)

---

## 📊 Performance e Escalabilidade

### **Benchmarks Testados**

- ✅ **1 milhão de registros** inseridos em < 3 minutos
- ✅ **Consultas complexas** com 50+ JOINs executadas eficientemente
- ✅ **Transações distribuídas** com 100+ operações
- ✅ **Mensageria AQ** processando 10k+ mensagens/minuto
- ✅ **PL/SQL blocks** com loops de milhões de iterações

### **Otimizações Implementadas**

- **Statement caching** automático
- **Array DML** para operações em massa
- **Connection pooling** inteligente
- **Retry automático** para deadlocks
- **Streaming** para LOBs grandes
- **Batch processing** configurável

---

## 🗃️ Compatibilidade Completa

### **Versões Oracle Database**

- ✅ **Oracle Database 12.1+** (todas as versões)
- ✅ **Oracle Database 18c, 19c, 21c, 23c**
- ✅ **Oracle Autonomous Database** (OCI)
- ✅ **Oracle Express Edition (XE)**
- ✅ **Oracle Standard/Enterprise Edition**
- ✅ **Oracle RDS** (AWS)
- ✅ **Oracle Cloud Infrastructure**

### **Ambientes de Deploy**

- ✅ **Windows** (10, 11, Server 2016+)
- ✅ **Linux** (Ubuntu, CentOS, RHEL, Alpine, Amazon Linux)
- ✅ **macOS** (Intel e Apple Silicon M1/M2)
- ✅ **Docker containers** (qualquer imagem base)
- ✅ **Kubernetes** (todos os orchestrators)
- ✅ **Serverless** (AWS Lambda, Azure Functions, Google Cloud Functions)
- ✅ **CI/CD** (GitHub Actions, GitLab CI, Jenkins)

### **Versões Node.js**

- ✅ **Node.js 18.x** (mínimo)
- ✅ **Node.js 20.x, 22.x** (recomendado)
- ✅ **Node.js 23.x** (mais recente)

---

## 🔐 Segurança Empresarial

### **Bind Variables Obrigatórias**

- **Proteção total** contra SQL Injection
- **Performance otimizada** com statement caching
- **Logs seguros** sem exposição de dados sensíveis

### **Connection Security**

- **SSL/TLS** suportado nativamente
- **Oracle Wallet** compatível
- **Kerberos authentication** suportado
- **Proxy authentication** disponível

### **Auditoria e Compliance**

- **Logs detalhados** de todas as operações
- **Rastreamento de transações** com correlation ID
- **Métricas de performance** integradas
- **Error handling** robusto com stack traces

---

## 🆘 Solução de Problemas

### **Erro: ORA-12541 (TNS:no listener)**

```

Causa: Serviço Oracle não está rodando ou connection string incorreta
Solução:

1. Verificar se o Oracle está ativo: lsnrctl status
2. Confirmar host:port/service_name na connection string
3. Testar conectividade: telnet host port
```

### **Erro: ORA-01017 (invalid username/password)**

```

Causa: Credenciais incorretas ou usuário bloqueado
Solução:

1. Verificar usuário e senha
2. Confirmar se conta não está expirada: ALTER USER user IDENTIFIED BY password;
3. Verificar permissões: GRANT CONNECT, RESOURCE TO user;
```

### **Erro: Pool timeout**

```

Causa: Muitas conexões em uso ou pool saturado
Solução:

1. Aumentar poolMax nas configurações
2. Verificar se conexões estão sendo fechadas corretamente
3. Usar pool adequado (OLTP para muitas transações pequenas)
```

### **Performance lenta em Bulk Operations**

```

Otimizações:

1. Aumentar batchSize para 5000-10000
2. Usar High Volume Pool
3. Desabilitar autoCommit e fazer commits manuais
4. Verificar índices nas tabelas de destino
```

---

## 🧪 Desenvolvimento e Testes

### **Configuração do ambiente de desenvolvimento**

```


# Clonar repositório

git clone https://github.com/jonales/n8n-nodes-oracle-thin.git
cd n8n-nodes-oracle-thin

# Instalar dependências

npm install

# Build do projeto

npm run build

# Executar testes

npm test

# Modo desenvolvimento (watch)

npm run dev

```

### **Testar localmente antes de publicar**

```


# No diretório do pacote

npm run build
npm link

# No diretório do seu n8n

npm link n8n-nodes-oracle-thin

# Iniciar n8n e testar funcionalidades

# ...

# Quando terminar os testes

npm unlink n8n-nodes-oracle-thin

```

### **Scripts disponíveis**

```

npm run clean              \# Limpar dist e cache
npm run build              \# Compilar TypeScript + copiar ícones
npm run build:watch        \# Build em modo watch
npm run build:assets       \# Copiar apenas assets (ícones)
npm run dev                \# Modo desenvolvimento (watch)
npm run lint               \# Verificar código com ESLint
npm run lint:fix           \# Corrigir problemas ESLint automaticamente
npm run format             \# Formatar código com Prettier
npm run format:check       \# Verificar formatação sem alterar
npm run type-check         \# Verificar tipos TypeScript
npm test                   \# Executar testes automatizados
npm test:watch             \# Testes em modo watch
npm test:coverage          \# Testes com relatório de cobertura
npm run validate           \# Executar type-check + lint + test
npm run prepublishOnly     \# Verificações antes de publicar
npm run release            \# Publicar com semantic-release

```

---

## 🤝 Contribuições

Contribuições são **muito bem-vindas**! Este é um projeto open source e sua colaboração é fundamental para torná-lo ainda melhor.

### **Como contribuir**

1. **Faça um fork** do repositório
2. **Crie uma branch** para sua feature: `git checkout -b feature/nova-funcionalidade`
3. **Faça suas alterações** e adicione testes se necessário
4. **Commit** suas mudanças: `git commit -m 'feat: adiciona nova funcionalidade'`
5. **Push** para a branch: `git push origin feature/nova-funcionalidade`
6. **Abra um Pull Request** com descrição detalhada

### **Tipos de contribuição**

- 🐛 **Bug fixes** - Correções de problemas identificados
- ⚡ **Performance** - Otimizações de velocidade e memória
- 📚 **Documentação** - Melhorias na documentação e exemplos
- ✨ **Features** - Novas funcionalidades e recursos
- 🧪 **Testes** - Adição de testes automatizados
- 🔧 **Refactoring** - Melhorias na estrutura do código

### **💰 Apoie o projeto**

Se este projeto te ajudou, considere fazer uma contribuição via **PIX** para apoiar seu desenvolvimento contínuo:

<div align="center">

### PIX:

<img src="image/README/qrcode-pix-jonatas.mei@outlook.com.png" alt="QR Code PIX" width="150" />

**Chave PIX:** jonatas.mei@outlook.com

### Doação em Criptomoeda

<table style="width:100%; border:none;">
  <tr style="border:none;">
    <td style="text-align:center; padding:10px; border:none;">
      <h4>Bitcoin (BTC)</h4>
      <img src="image/README/btc.jpeg" alt="QR Code BTC" width="150" />
      <br>
      <code>bc1qdq9rj7565c4fvr7t3xut6z0tjd65p4mudrc0ll</code>
      <br>
      <a href="https://link.trustwallet.com/send?asset=c0&address=bc1qdq9rj7565c4fvr7t3xut6z0tjd65p4mudrc0ll">Pagar com Trust Wallet</a>
    </td>
    <td style="text-align:center; padding:10px; border:none;">
      <h4>Ethereum (ETH)</h4>
      <img src="image/README/eth.jpeg" alt="QR Code ETH" width="150" />
      <br>
      <code>0xA35A984401Ae9c81ca2d742977E603421df45419</code>
      <br>
      <a href="https://link.trustwallet.com/send?address=0xA35A984401Ae9c81ca2d742977E603421df45419&asset=c60">Pagar com Trust Wallet</a>
    </td>
  </tr>
  <tr style="border:none;">
    <td style="text-align:center; padding:10px; border:none;">
      <h4>Binance (BNB)</h4>
      <img src="image/README/bnb.jpeg" alt="QR Code BNB" width="150" />
      <br>
      <code>0xA35A984401Ae9c81ca2d742977E603421df45419</code>
      <br>
      <a href="https://link.trustwallet.com/send?address=0xA35A984401Ae9c81ca2d742977E603421df45419&asset=c20000714">Pagar com Trust Wallet</a>
    </td>
    <td style="text-align:center; padding:10px; border:none;">
      <h4>Polygon (POL)</h4>
      <img src="image/README/pol.jpeg" alt="QR Code POL" width="150" />
      <br>
      <code>0xA35A984401Ae9c81ca2d742977E603421df45419</code>
      <br>
      <a href="https://link.trustwallet.com/send?asset=c966&address=0xA35A984401Ae9c81ca2d742977E603421df45419">Pagar com Trust Wallet</a>
    </td>
  </tr>
</table>

</div>

**Por que contribuir financeiramente?**

- ⏰ **Mais tempo** dedicado ao desenvolvimento de novas features
- 🛠️ **Manutenção** proativa com correções rápidas
- 📖 **Documentação** cada vez mais completa e didática
- 🧪 **Testes** em diferentes versões do Oracle e ambientes
- 💬 **Suporte** mais rápido na resolução de issues

Toda contribuição, por menor que seja, faz diferença e é muito apreciada! 🙏

---

## 📦 Dependências Técnicas

### **Runtime Dependencies**

```json
{
	"oracledb": "^6.9.0" // Cliente Oracle com thin mode nativo
}
```

### **Development Dependencies**

```json
{
	"typescript": "^5.7.2", // TypeScript compiler
	"eslint": "^9.33.0", // Code linter
	"prettier": "^3.3.3", // Code formatter
	"@eslint/js": "^9.33.0", // ESLint flat config support
	"@typescript-eslint/eslint-plugin": "^8.39.1", // TypeScript ESLint rules
	"@typescript-eslint/parser": "^8.39.1", // TypeScript ESLint parser
	"eslint-config-prettier": "^9.1.0", // Turns off ESLint rules that conflict with Prettier
	"eslint-plugin-prettier": "^5.2.1", // Runs Prettier as an ESLint rule
	"eslint-plugin-import": "^2.31.0", // Linting for ES6+ import/export syntax
	"eslint-plugin-n8n-nodes-base": "^1.16.3", // ESLint rules for n8n community nodes
	"prettier-plugin-organize-imports": "^3.2.4", // Organize imports automatically
	"jest": "^29.7.0", // Testing framework
	"ts-jest": "^29.2.5", // Jest transformer for TypeScript
	"@types/jest": "^29.5.14", // TypeScript types for Jest
	"gulp": "^5.0.0", // Build automation
	"del": "^7.1.0", // File deletion for gulp tasks
	"rimraf": "^6.0.1", // Cross-platform `rm -rf`
	"husky": "^9.1.7", // Git hooks
	"lint-staged": "^15.2.10", // Run linters on staged git files
	"semantic-release": "^24.2.0", // Automated releases
	"@semantic-release/changelog": "^6.0.3", // Plugin for changelog generation
	"@semantic-release/git": "^10.0.1", // Commit version updates
	"@semantic-release/github": "^10.3.5", // GitHub releases integration
	"@semantic-release/npm": "^12.0.1", // Publishes to npm
	"@types/node": "^22.10.1", // TypeScript types for Node.js
	"n8n-workflow": "^1.105.0" // Types used in n8n custom nodes
}
```

---

## 📄 Licença

Este projeto está licenciado sob a **Licença MIT** - veja o arquivo [LICENSE.md](LICENSE.md) para detalhes.

```

MIT License

Copyright (c) 2025 Jônatas Meireles Sousa Vieira

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

```

---

## 👨‍💻 Autor

**Jônatas Meireles Sousa Vieira**  
📧 [jonatas.mei@outlook.com](mailto:jonatas.mei@outlook.com)  
🔗 [GitHub: @jonales](https://github.com/jonales)  
🌐 [LinkedIn](https://www.linkedin.com/in/jonatasmeireles/)

---

## 🌟 Agradecimentos

- **Oracle Corporation** - Pela excelente biblioteca `node-oracledb`
- **Comunidade n8n** - Por tornar a automação acessível a todos
- **Contribuidores** - Todos que ajudam a melhorar este projeto

---

## 📚 Links Úteis

- [📖 Oracle Database Documentation](https://docs.oracle.com/en/database/oracle/oracle-database/)
- [🔧 n8n Community Nodes](https://docs.n8n.io/integrations/community-nodes/)
- [📚 Oracle node-oracledb Documentation](https://node-oracledb.readthedocs.io/)
- [🐛 Report Issues](https://github.com/jonales/n8n-nodes-oracle-thin/issues)
- [💬 Discussions](https://github.com/jonales/n8n-nodes-oracle-thin/discussions)

---

<div align="center">

**⭐ Se este projeto foi útil, considere dar uma estrela no GitHub! ⭐**

[![GitHub stars](https://img.shields.io/github/stars/jonales/n8n-nodes-oracle-thin.svg?style=social&label=Star)](https://github.com/jonales/n8n-nodes-oracle-thin)
[![GitHub forks](https://img.shields.io/github/forks/jonales/n8n-nodes-oracle-thin.svg?style=social&label=Fork)](https://github.com/jonales/n8n-nodes-oracle-thin/fork)

Made with ❤️ for the Oracle and n8n communities

</div>

</details>
