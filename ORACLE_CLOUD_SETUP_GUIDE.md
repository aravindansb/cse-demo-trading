# Step-by-Step Guide: Launching CSE Demo Trading on Oracle Cloud Always Free

This guide walks you through setting up your permanent **$0/month Oracle Cloud server** with **10,000 GB (10 TB) free monthly bandwidth** and **up to 24 GB RAM**.

---

## Step 1: Create Your Free Account

1. Go to **[cloud.oracle.com](https://cloud.oracle.com)**.
2. Click **Start for free**.
3. Enter your country, name, and email.
4. **Choose Home Region**: Select a region close to Sri Lanka (e.g. **Singapore**, **Mumbai**, or **Hyderabad**).
5. **Card Verification**: Enter your credit/debit card (Oracle places a temporary \$1 hold and refunds it immediately to verify you are human). You are **never billed** as long as you use Always Free resources.

---

## Step 2: Create Your Free Virtual Machine (VM)

1. Log into your Oracle Cloud Console.
2. In the search bar at the top or on the homepage, click **Create a VM instance**.
3. Configure the following fields:
   - **Name**: `cse-trading-server`
   - **Placement**: Keep default Availability Domain.
   - **Image and shape**:
     - Click **Change image**: Select **Ubuntu 22.04** or **Ubuntu 24.04** (Minimal or standard).
     - Click **Change shape**: Select **Ampere (ARM Processor)** $\rightarrow$ Choose `VM.Standard.A1.Flex`.
     - Allocate: **2 to 4 OCPUs** and **12 to 24 GB Memory** (Notice the green *"Always Free Eligible"* label).
   - **Networking**:
     - Select *"Create new virtual cloud network"*.
     - Ensure *"Assign a public IPv4 address"* is selected (**Yes**).
   - **Save private key**:
     - Under **Add SSH keys**, select **Generate a key pair for me**.
     - Click **Save private key** and save the file (e.g., `ssh-key.key`) to your computer.
4. Click the blue **Create** button at the bottom.
5. In about 60 seconds, the status will turn green (**RUNNING**).
6. Copy the **Public IP Address** (e.g., `140.238.xxx.xxx`).

---

## Step 3: Open Ports 80 & 443 in Oracle Firewall

By default, Oracle Cloud blocks web ports. You must enable HTTP/HTTPS traffic:

1. In Oracle Console, click the hamburger menu $\equiv$ in the top left $\rightarrow$ **Networking** $\rightarrow$ **Virtual Cloud Networks**.
2. Click the name of your VCN (created in Step 2).
3. On the left side, click **Security Lists** $\rightarrow$ Click **Default Security List for...**.
4. Click **Add Ingress Rules**:
   - **Source CIDR**: `0.0.0.0/0`
   - **IP Protocol**: `TCP`
   - **Destination Port Range**: `80,443`
   - **Description**: `Allow web traffic for CSE Trading App`
5. Click **Add Ingress Rules**.

---

## Step 4: Connect and Run the App (One Command!)

Open **PowerShell** or **Command Prompt** on your computer.

1. Navigate to the folder where you saved your private key file:
   ```powershell
   cd C:\Users\Dell\Downloads
   ```

2. Connect to your Oracle server (replace with your downloaded key name and public IP):
   ```bash
   ssh -i ssh-key.key ubuntu@<YOUR_ORACLE_PUBLIC_IP>
   ```

3. Once connected inside the server terminal, clone and deploy in one step:
   ```bash
   git clone https://github.com/aravindansb/cse-demo-trading.git
   cd cse-demo-trading
   bash deploy-oracle.sh
   ```

That is it! The script will automatically:
- Install Docker and Docker Compose.
- Open the Ubuntu local firewall for port 80.
- Build and launch the Backend, Frontend, and Nginx reverse proxy.
- Print your live application URL: `http://<YOUR_ORACLE_PUBLIC_IP>`.

---

## Step 5: (Optional) Free Custom Domain & HTTPS / SSL

If you want a free domain name like `https://csetrading.duckdns.org` instead of an IP address:
1. Go to **[duckdns.org](https://www.duckdns.org)** (100% free forever).
2. Log in with Google/GitHub and create a subdomain (e.g., `csetrading`).
3. Enter your Oracle Public IP address and click **update ip**.
4. To enable automatic free SSL certificates, you can run Certbot with Let's Encrypt anytime.
