import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  UseGuards,
  Header,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminGuard } from './guards/admin.guard';

@ApiTags('Admin Panel')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('login')
  @ApiOperation({ summary: 'Authenticate Super-Admin User Account' })
  @ApiResponse({ status: 200, description: 'Admin authentication successful' })
  @ApiResponse({ status: 403, description: 'Forbidden - Account lacks Super-Admin privileges' })
  async login(@Body() body: any) {
    return this.adminService.adminLogin(body.usernameOrEmail, body.password);
  }

  @Get()
  @Header('Content-Type', 'text/html')
  @ApiOperation({ summary: 'Serve Interactive Admin Management Dashboard Web Interface' })
  getAdminPanelUI(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CalcVersa - Super Admin Panel</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-primary: #0f172a;
      --bg-card: #1e293b;
      --accent: #6366f1;
      --accent-hover: #4f46e5;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --border: #334155;
      --danger: #ef4444;
      --success: #10b981;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; }
    body { background: var(--bg-primary); color: var(--text-main); min-height: 100vh; }
    
    /* Login Overlay & Card */
    #login-overlay {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center; z-index: 9999;
    }
    .login-card {
      background: var(--bg-card); padding: 2.5rem; border-radius: 1rem;
      border: 1px solid var(--border); width: 100%; max-width: 420px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .login-card h2 { font-size: 1.5rem; margin-bottom: 0.5rem; color: #ffffff; }
    .login-card p { color: var(--text-muted); font-size: 0.875rem; margin-bottom: 1.5rem; }
    .form-group { margin-bottom: 1.25rem; }
    .form-group label { display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem; }
    .form-control {
      width: 100%; padding: 0.75rem 1rem; background: var(--bg-primary);
      border: 1px solid var(--border); border-radius: 0.5rem; color: #fff; font-size: 0.95rem;
    }
    .form-control:focus { outline: none; border-color: var(--accent); }
    .btn-login {
      width: 100%; padding: 0.75rem; background: var(--accent); color: white;
      border: none; border-radius: 0.5rem; font-weight: 600; cursor: pointer; font-size: 1rem;
    }
    .btn-login:hover { background: var(--accent-hover); }
    .error-msg { color: var(--danger); font-size: 0.85rem; margin-top: 1rem; display: none; }

    /* Dashboard Layout */
    .dashboard-container { padding: 2rem; max-width: 1400px; margin: 0 auto; display: none; }
    header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 1.5rem; border-bottom: 1px solid var(--border); margin-bottom: 2rem; }
    h1 { font-size: 1.75rem; font-weight: 700; background: linear-gradient(135deg, #a5b4fc, #6366f1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .header-actions { display: flex; align-items: center; gap: 1rem; }
    .badge { background: rgba(16, 185, 129, 0.2); color: #34d399; padding: 0.35rem 0.75rem; border-radius: 9999px; font-size: 0.85rem; border: 1px solid rgba(16, 185, 129, 0.3); font-weight: 500; }
    .btn-logout { background: rgba(239, 68, 68, 0.2); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.4); padding: 0.4rem 0.9rem; border-radius: 0.5rem; cursor: pointer; font-weight: 500; font-size: 0.85rem; }
    .btn-logout:hover { background: rgba(239, 68, 68, 0.3); }

    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; margin-bottom: 2.5rem; }
    .stat-card { background: var(--bg-card); padding: 1.5rem; border-radius: 0.75rem; border: 1px solid var(--border); }
    .stat-card .label { color: var(--text-muted); font-size: 0.875rem; margin-bottom: 0.5rem; }
    .stat-card .value { font-size: 2rem; font-weight: 700; color: #ffffff; }

    .tabs { display: flex; gap: 1rem; border-bottom: 1px solid var(--border); margin-bottom: 1.5rem; }
    .tab-btn { background: none; border: none; color: var(--text-muted); padding: 0.75rem 1.25rem; font-size: 0.95rem; font-weight: 500; cursor: pointer; border-bottom: 2px solid transparent; }
    .tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); }

    .table-container { background: var(--bg-card); border-radius: 0.75rem; border: 1px solid var(--border); overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem; }
    th { background: rgba(15, 23, 42, 0.5); padding: 1rem; color: var(--text-muted); font-weight: 600; border-bottom: 1px solid var(--border); }
    td { padding: 1rem; border-bottom: 1px solid var(--border); }
    tr:last-child td { border-bottom: none; }
    .btn-action { background: var(--accent); color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 0.375rem; cursor: pointer; font-size: 0.8rem; }
    pre { background: #090d16; padding: 0.5rem; border-radius: 0.375rem; font-size: 0.8rem; max-width: 300px; overflow-x: auto; }
  </style>
</head>
<body>

  <!-- Admin Authentication Modal -->
  <div id="login-overlay">
    <div class="login-card">
      <h2>Super-Admin Authentication</h2>
      <p>Enter your Super-Admin credentials to access the CalcVersa management panel.</p>
      <form id="admin-login-form" onsubmit="handleLogin(event)">
        <div class="form-group">
          <label>Username or Email</label>
          <input type="text" id="login-user" class="form-control" placeholder="johndoe" required />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" id="login-pass" class="form-control" placeholder="••••••••" required />
        </div>
        <button type="submit" class="btn-login">Authenticate Admin</button>
        <div id="error-msg" class="error-msg"></div>
      </form>
    </div>
  </div>

  <!-- Authenticated Admin Dashboard -->
  <div id="dashboard" class="dashboard-container">
    <header>
      <div>
        <h1>CalcVersa Admin Management Panel</h1>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.25rem;">Super-Admin Database Control Console</p>
      </div>
      <div class="header-actions">
        <span class="badge" id="admin-user-display">Super-Admin</span>
        <button class="btn-logout" onclick="handleLogout()">Logout</button>
      </div>
    </header>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="label">Total Registered Users</div>
        <div class="value" id="stat-users">...</div>
      </div>
      <div class="stat-card">
        <div class="label">Calculator Tools</div>
        <div class="value" id="stat-apps">...</div>
      </div>
      <div class="stat-card">
        <div class="label">Calculation Logs</div>
        <div class="value" id="stat-records">...</div>
      </div>
      <div class="stat-card">
        <div class="label">Permission Grants</div>
        <div class="value" id="stat-permissions">...</div>
      </div>
    </div>

    <div class="tabs">
      <button class="tab-btn active" onclick="showTab(event, 'users')">Users Management</button>
      <button class="tab-btn" onclick="showTab(event, 'apps')">Calculator Tools (Apps)</button>
      <button class="tab-btn" onclick="showTab(event, 'records')">Calculation Logs (AppRecords)</button>
    </div>

    <div id="sec-users" class="table-container">
      <table>
        <thead>
          <tr>
            <th>ID</th><th>Username</th><th>Email</th><th>Name</th><th>Status</th><th>Is Admin</th><th>Created At</th><th>Action</th>
          </tr>
        </thead>
        <tbody id="tbl-users"><tr><td colspan="8">Loading users...</td></tr></tbody>
      </table>
    </div>

    <div id="sec-apps" class="table-container" style="display: none;">
      <table>
        <thead>
          <tr>
            <th>ID</th><th>Name</th><th>Description</th><th>Inputs Config</th><th>Formula Config</th><th>UI Config</th><th>Created At</th>
          </tr>
        </thead>
        <tbody id="tbl-apps"><tr><td colspan="7">Loading apps...</td></tr></tbody>
      </table>
    </div>

    <div id="sec-records" class="table-container" style="display: none;">
      <table>
        <thead>
          <tr>
            <th>ID</th><th>App ID</th><th>User ID</th><th>Payload</th><th>Results</th><th>Record Date</th><th>Logged At</th>
          </tr>
        </thead>
        <tbody id="tbl-records"><tr><td colspan="7">Loading calculation records...</td></tr></tbody>
      </table>
    </div>
  </div>

  <script>
    async function handleLogin(e) {
      e.preventDefault();
      const user = document.getElementById('login-user').value;
      const pass = document.getElementById('login-pass').value;
      const errorDiv = document.getElementById('error-msg');
      errorDiv.style.display = 'none';

      try {
        const res = await fetch('/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usernameOrEmail: user, password: pass })
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Authentication failed');
        }

        sessionStorage.setItem('calcversa_admin_token', data.admin_token);
        sessionStorage.setItem('calcversa_admin_user', data.admin.username);
        initDashboard();
      } catch (err) {
        errorDiv.innerText = err.message;
        errorDiv.style.display = 'block';
      }
    }

    function handleLogout() {
      sessionStorage.removeItem('calcversa_admin_token');
      sessionStorage.removeItem('calcversa_admin_user');
      document.getElementById('dashboard').style.display = 'none';
      document.getElementById('login-overlay').style.display = 'flex';
      document.getElementById('admin-login-form').reset();
    }

    function initDashboard() {
      const token = sessionStorage.getItem('calcversa_admin_token');
      const adminUser = sessionStorage.getItem('calcversa_admin_user');
      if (!token) {
        document.getElementById('login-overlay').style.display = 'flex';
        document.getElementById('dashboard').style.display = 'none';
        return;
      }

      document.getElementById('login-overlay').style.display = 'none';
      document.getElementById('dashboard').style.display = 'block';
      document.getElementById('admin-user-display').innerText = 'Admin: ' + (adminUser || 'Super-Admin');
      loadDashboardData();
    }

    async function authFetch(url, options = {}) {
      const token = sessionStorage.getItem('calcversa_admin_token');
      options.headers = {
        ...options.headers,
        'Authorization': 'Bearer ' + token
      };
      const res = await fetch(url, options);
      if (res.status === 401 || res.status === 403) {
        handleLogout();
        alert('Admin Session Expired or Privileges Revoked');
        throw new Error('Unauthorized');
      }
      return res.json();
    }

    async function loadDashboardData() {
      try {
        const stats = await authFetch('/admin/api/stats');
        document.getElementById('stat-users').innerText = stats.total_users;
        document.getElementById('stat-apps').innerText = stats.total_apps;
        document.getElementById('stat-records').innerText = stats.total_records;
        document.getElementById('stat-permissions').innerText = stats.total_permissions;

        const users = await authFetch('/admin/api/users');
        document.getElementById('tbl-users').innerHTML = users.map(u => \`
          <tr>
            <td>\${u.id.substring(0,8)}...</td>
            <td><strong>\${u.username}</strong></td>
            <td>\${u.email}</td>
            <td>\${u.first_name} \${u.last_name}</td>
            <td><span style="color: #10b981; font-weight: 600;">\${u.status ? 'Active' : 'Inactive'}</span></td>
            <td>\${u.is_admin ? '<span style="color: #6366f1; font-weight: bold;">Yes (Admin)</span>' : 'No'}</td>
            <td>\${new Date(u.created_at).toLocaleDateString()}</td>
            <td>
              <button class="btn-action" onclick="toggleAdmin('\${u.id}', \${!u.is_admin})">
                \${u.is_admin ? 'Demote' : 'Make Admin'}
              </button>
            </td>
          </tr>
        \`).join('');

        const apps = await authFetch('/admin/api/apps');
        document.getElementById('tbl-apps').innerHTML = apps.map(a => \`
          <tr>
            <td>\${a.id.substring(0,8)}...</td>
            <td><strong>\${a.name}</strong></td>
            <td>\${a.description}</td>
            <td><pre>\${JSON.stringify(a.inputsConfig, null, 2)}</pre></td>
            <td><pre>\${JSON.stringify(a.formulaConfig, null, 2)}</pre></td>
            <td><pre>\${JSON.stringify(a.uiConfig, null, 2)}</pre></td>
            <td>\${new Date(a.created_at).toLocaleDateString()}</td>
          </tr>
        \`).join('');

        const records = await authFetch('/admin/api/records');
        document.getElementById('tbl-records').innerHTML = records.map(r => \`
          <tr>
            <td>\${r.id.substring(0,8)}...</td>
            <td>\${r.app_id.substring(0,8)}...</td>
            <td>\${r.user_id.substring(0,8)}...</td>
            <td><pre>\${JSON.stringify(r.payload, null, 2)}</pre></td>
            <td><pre>\${JSON.stringify(r.results, null, 2)}</pre></td>
            <td>\${r.record_date}</td>
            <td>\${new Date(r.created_at).toLocaleString()}</td>
          </tr>
        \`).join('');
      } catch (err) {
        console.error('Error loading admin data:', err);
      }
    }

    function showTab(e, tab) {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.table-container').forEach(c => c.style.display = 'none');
      e.target.classList.add('active');
      document.getElementById('sec-' + tab).style.display = 'block';
    }

    async function toggleAdmin(userId, makeAdmin) {
      await authFetch('/admin/api/users/' + userId + '/role', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_admin: makeAdmin })
      });
      loadDashboardData();
    }

    initDashboard();
  </script>
</body>
</html>
    `;
  }

  @Get('api/stats')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Admin Dashboard Statistics Summary (Requires is_admin === true)' })
  @ApiResponse({ status: 200, description: 'Dashboard summary statistics' })
  @ApiResponse({ status: 403, description: 'Forbidden - Account lacks Super-Admin privileges' })
  async getStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('api/users')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all user accounts for admin inspection (Requires is_admin === true)' })
  @ApiResponse({ status: 200, description: 'List of all user accounts' })
  @ApiResponse({ status: 403, description: 'Forbidden - Account lacks Super-Admin privileges' })
  async getUsers() {
    return this.adminService.getAllUsers();
  }

  @Put('api/users/:id/role')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user admin status (Requires is_admin === true)' })
  @ApiResponse({ status: 200, description: 'User admin status updated' })
  @ApiResponse({ status: 403, description: 'Forbidden - Account lacks Super-Admin privileges' })
  async toggleAdminRole(@Param('id') id: string, @Body('is_admin') isAdmin: boolean) {
    return this.adminService.toggleAdminRole(id, isAdmin);
  }

  @Get('api/apps')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all calculator tools and configurations (Requires is_admin === true)' })
  @ApiResponse({ status: 200, description: 'List of all calculator tools' })
  @ApiResponse({ status: 403, description: 'Forbidden - Account lacks Super-Admin privileges' })
  async getApps() {
    return this.adminService.getAllApps();
  }

  @Get('api/records')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all calculation records (Requires is_admin === true)' })
  @ApiResponse({ status: 200, description: 'List of calculation records' })
  @ApiResponse({ status: 403, description: 'Forbidden - Account lacks Super-Admin privileges' })
  async getRecords() {
    return this.adminService.getAllRecords();
  }
}
