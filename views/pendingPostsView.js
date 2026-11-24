const { escapeHtml, csrfPostScript } = require('../lib/auth');
const { renderAdminLayout } = require('./layoutView');

function renderPendingPostsDetail({ item, type, csrfToken, admin_username = 'Admin' }) {
  const isLost = type === 'lost';
  const pageTitle = isLost ? 'Pending Lost Item Details' : 'Pending Found Item Details';
  const id = isLost ? item.lost_id : item.found_id;
  const imgSrc = (item.item_image && item.item_image.startsWith('data:'))
    ? `image.php?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`
    : (item.item_image ? escapeHtml(item.item_image) : '');

  const imageHtml = imgSrc
    ? `<div class="p-4 rounded-xl bg-slate-50 border border-slate-200">
         <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Picture</span>
         <img src="${imgSrc}" class="max-w-xs rounded-xl shadow-xs border border-slate-200">
       </div>`
    : '';

  const content = `
    <!-- HEADER -->
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-extrabold text-slate-900 tracking-tight">${pageTitle}</h2>
        <p class="text-sm text-slate-500 mt-1">Review the submitted post information before approving or rejecting.</p>
      </div>
      <a href="pending-posts.php" class="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl font-semibold transition inline-flex items-center gap-1.5 back-button">
        <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i>
        <span>Back to Pending Posts</span>
      </a>
    </div>

    <!-- DETAILS GRID -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <!-- USER INFO -->
      <div class="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
        <div class="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <i data-lucide="user" class="w-5 h-5 text-amber-500"></i>
          <h3 class="text-base font-bold text-slate-900">User Information</h3>
        </div>
        <div class="space-y-3 text-xs">
          <div>
            <span class="text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Full Name</span>
            <p class="font-bold text-slate-900 text-sm">${escapeHtml(item.full_name || 'N/A')}</p>
          </div>
          <div>
            <span class="text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Student ID</span>
            <p class="font-bold text-slate-900 text-sm">${escapeHtml(item.student_id || 'N/A')}</p>
          </div>
          <div>
            <span class="text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Email</span>
            <p class="font-semibold text-slate-800 text-sm">${escapeHtml(item.email || 'N/A')}</p>
          </div>
          <div>
            <span class="text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Department</span>
            <p class="font-semibold text-slate-800 text-sm">${escapeHtml(item.department || 'N/A')}</p>
          </div>
        </div>
      </div>

      <!-- ITEM INFO -->
      <div class="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
        <div class="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <i data-lucide="package" class="w-5 h-5 text-amber-500"></i>
          <h3 class="text-base font-bold text-slate-900">Item Information</h3>
        </div>
        <div class="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span class="text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Item Name</span>
            <p class="font-bold text-slate-900 text-sm">${escapeHtml(item.item_name)}</p>
          </div>
          <div>
            <span class="text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Category</span>
            <p class="font-bold text-slate-800 text-sm">${escapeHtml(item.category)}</p>
          </div>
          <div>
            <span class="text-slate-400 font-bold uppercase tracking-wider block mb-0.5">${isLost ? 'Lost Date' : 'Found Date'}</span>
            <p class="font-bold text-slate-800">${escapeHtml(isLost ? item.lost_date : item.found_date)}</p>
          </div>
          <div>
            <span class="text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Location</span>
            <p class="font-bold text-slate-800">${escapeHtml(isLost ? item.lost_location : item.found_location)}</p>
          </div>
          <div class="col-span-2">
            <span class="text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Contact</span>
            <p class="font-bold text-slate-800 font-mono">${escapeHtml(isLost ? item.contact_information : item.finder_contact_information)}</p>
          </div>
        </div>

        <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
          <span class="text-slate-400 text-[11px] font-bold uppercase block mb-1">Description</span>
          <p class="text-slate-700 text-xs leading-relaxed whitespace-pre-wrap">${escapeHtml(item.description || '').replace(/\n/g, '<br>')}</p>
        </div>

        ${isLost ? `
          <div class="bg-amber-50 border border-amber-200 rounded-xl p-3.5">
            <span class="text-amber-800 text-[11px] font-bold uppercase block mb-1">Secret Information</span>
            <p class="text-slate-800 text-xs leading-relaxed whitespace-pre-wrap">${escapeHtml(item.secret_information || 'None').replace(/\n/g, '<br>')}</p>
          </div>
        ` : ''}

        ${imageHtml}

        <div class="flex items-center justify-between text-xs pt-2">
          <div>
            <span class="text-slate-400 font-semibold">Status:</span>
            <span class="inline-block px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold status">${escapeHtml(item.status)}</span>
          </div>
          <span class="text-slate-400">Posted: ${escapeHtml(item.created_at)}</span>
        </div>
      </div>
    </div>

    <!-- ACTION BUTTONS -->
    <div class="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 flex flex-wrap gap-4 action-buttons">
      <a href="approve-post.php?id=${id}&type=${type}" data-post="1" class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition shadow-xs inline-flex items-center gap-1.5 approve-button">
        <i data-lucide="check" class="w-4 h-4"></i>
        <span>Approve</span>
      </a>
      <a href="reject-post.php?id=${id}&type=${type}" data-post="1" class="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition shadow-xs inline-flex items-center gap-1.5 reject-button">
        <i data-lucide="x" class="w-4 h-4"></i>
        <span>Reject</span>
      </a>
    </div>
  `;

  return renderAdminLayout({
    title: pageTitle,
    activeNav: 'pending',
    admin_username,
    content,
    scripts: csrfPostScript(csrfToken)
  });
}

function renderPendingPostsList({ pending_lost = [], pending_found = [], csrfToken, admin_username = 'Admin' }) {
  const lostRows = (pending_lost && pending_lost.length > 0) ? pending_lost.map(row => `
    <tr class="hover:bg-slate-50/80 transition border-b border-slate-100">
      <td class="py-3.5 px-4 font-bold text-slate-900 text-xs">#${escapeHtml(row.lost_id)}</td>
      <td class="py-3.5 px-4 font-bold text-slate-900 text-sm">${escapeHtml(row.item_name)}</td>
      <td class="py-3.5 px-4">
        <span class="inline-block bg-teal-50 text-teal-700 border border-teal-200 text-xs px-2.5 py-0.5 rounded-full font-semibold">
          ${escapeHtml(row.category)}
        </span>
      </td>
      <td class="py-3.5 px-4 text-xs text-slate-600 max-w-xs truncate">${escapeHtml(row.description || '')}</td>
      <td class="py-3.5 px-4 text-xs text-slate-700 font-semibold">${escapeHtml(row.full_name || 'N/A')}</td>
      <td class="py-3.5 px-4 text-xs text-slate-500">${escapeHtml(row.lost_date)}</td>
      <td class="py-3.5 px-4 text-xs text-amber-700 font-mono">${escapeHtml(row.secret_information || '')}</td>
      <td class="py-3.5 px-4">
        <span class="inline-block px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold status-badge">
          ${escapeHtml(row.status)}
        </span>
      </td>
      <td class="py-3.5 px-4 text-xs space-x-1">
        <a href="pending-posts.php?id=${row.lost_id}&type=lost" class="px-2.5 py-1 bg-[#003844] hover:bg-[#0fa4af] text-white rounded-lg font-bold transition inline-block view-details-btn">View Details</a>
        <a href="approve-post.php?id=${row.lost_id}&type=lost" data-post="1" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition inline-block approve-btn">Approve</a>
        <a href="reject-post.php?id=${row.lost_id}&type=lost" data-post="1" class="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold transition inline-block reject-btn">Reject</a>
      </td>
    </tr>
  `).join('') : `<tr><td colspan="9" class="py-8 text-center text-slate-400 text-xs empty-message">No pending lost items found.</td></tr>`;

  const foundRows = (pending_found && pending_found.length > 0) ? pending_found.map(row => `
    <tr class="hover:bg-slate-50/80 transition border-b border-slate-100">
      <td class="py-3.5 px-4 font-bold text-slate-900 text-xs">#${escapeHtml(row.found_id)}</td>
      <td class="py-3.5 px-4 font-bold text-slate-900 text-sm">${escapeHtml(row.item_name)}</td>
      <td class="py-3.5 px-4">
        <span class="inline-block bg-teal-50 text-teal-700 border border-teal-200 text-xs px-2.5 py-0.5 rounded-full font-semibold">
          ${escapeHtml(row.category)}
        </span>
      </td>
      <td class="py-3.5 px-4 text-xs text-slate-600 max-w-xs truncate">${escapeHtml(row.description || '')}</td>
      <td class="py-3.5 px-4 text-xs text-slate-700 font-semibold">${escapeHtml(row.full_name || 'N/A')}</td>
      <td class="py-3.5 px-4 text-xs text-slate-500">${escapeHtml(row.found_date)}</td>
      <td class="py-3.5 px-4">
        <span class="inline-block px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold status-badge">
          ${escapeHtml(row.status)}
        </span>
      </td>
      <td class="py-3.5 px-4 text-xs space-x-1">
        <a href="pending-posts.php?id=${row.found_id}&type=found" class="px-2.5 py-1 bg-[#003844] hover:bg-[#0fa4af] text-white rounded-lg font-bold transition inline-block view-details-btn">View Details</a>
        <a href="approve-post.php?id=${row.found_id}&type=found" data-post="1" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition inline-block approve-btn">Approve</a>
        <a href="reject-post.php?id=${row.found_id}&type=found" data-post="1" class="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold transition inline-block reject-btn">Reject</a>
      </td>
    </tr>
  `).join('') : `<tr><td colspan="8" class="py-8 text-center text-slate-400 text-xs empty-message">No pending found items found.</td></tr>`;

  const content = `
    <!-- HEADER -->
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-extrabold text-slate-900 tracking-tight">Pending Posts</h2>
        <p class="text-sm text-slate-500 mt-1">Posts waiting for admin approval.</p>
      </div>
      <a href="admin-dashboard.php" class="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl font-semibold transition inline-flex items-center gap-1.5 back-dashboard">
        <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i>
        <span>Back to Dashboard</span>
      </a>
    </div>

    <div class="space-y-6">
      <!-- PENDING LOST ITEMS -->
      <div class="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden table-card">
        <div class="px-6 py-4 bg-rose-50/70 border-b border-rose-100 flex items-center justify-between">
          <h3 class="font-bold text-base text-slate-900 flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            Pending Lost Items
          </h3>
          <span class="text-xs font-semibold text-rose-700 bg-rose-100/70 px-2.5 py-0.5 rounded-full">${pending_lost.length} Pending</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-slate-200 bg-slate-50/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th class="py-3 px-4">ID</th>
                <th class="py-3 px-4">Item Name</th>
                <th class="py-3 px-4">Category</th>
                <th class="py-3 px-4">Description</th>
                <th class="py-3 px-4">Posted By</th>
                <th class="py-3 px-4">Date</th>
                <th class="py-3 px-4">Secret Information</th>
                <th class="py-3 px-4">Status</th>
                <th class="py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody>
              ${lostRows}
            </tbody>
          </table>
        </div>
      </div>

      <!-- PENDING FOUND ITEMS -->
      <div class="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden table-card">
        <div class="px-6 py-4 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between">
          <h3 class="font-bold text-base text-slate-900 flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            Pending Found Items
          </h3>
          <span class="text-xs font-semibold text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">${pending_found.length} Pending</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-slate-200 bg-slate-50/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th class="py-3 px-4">ID</th>
                <th class="py-3 px-4">Item Name</th>
                <th class="py-3 px-4">Category</th>
                <th class="py-3 px-4">Description</th>
                <th class="py-3 px-4">Posted By</th>
                <th class="py-3 px-4">Date</th>
                <th class="py-3 px-4">Status</th>
                <th class="py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody>
              ${foundRows}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  return renderAdminLayout({
    title: 'Pending Posts',
    activeNav: 'pending',
    admin_username,
    content,
    scripts: csrfPostScript(csrfToken)
  });
}

module.exports = { renderPendingPostsDetail, renderPendingPostsList };
