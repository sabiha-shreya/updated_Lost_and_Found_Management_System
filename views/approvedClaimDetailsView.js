const { escapeHtml } = require('../lib/auth');
const { renderUserLayout, renderAdminLayout } = require('./layoutView');

function renderApprovedClaimDetails({ match, match_id, is_admin = false, is_owner = false, is_finder = false, full_name = 'Student', unread_count = 0, admin_username = 'Admin' }) {
  const lostImage = (match.lost_item_image && match.lost_item_image.startsWith('data:'))
    ? `image.php?type=lost&id=${encodeURIComponent(match.lost_id)}`
    : (match.lost_item_image ? escapeHtml(match.lost_item_image) : '');
  const backLink = is_admin ? 'admin-dashboard.php' : 'notifications.php';

  const content = `
    <!-- HEADER -->
    <div class="flex flex-wrap justify-between items-center gap-4 mb-6">
      <div>
        <div class="flex items-center gap-2.5">
          <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
          <h2 class="text-2xl font-extrabold text-slate-900 tracking-tight">Approved Claim Details</h2>
        </div>
        <p class="text-sm text-slate-500 mt-1">Match #${escapeHtml(match_id)} &bull; Exchange and Handover Information</p>
      </div>
      <a href="${backLink}" class="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl font-semibold transition inline-flex items-center gap-1.5">
        <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i>
        <span>Back</span>
      </a>
    </div>

    <!-- APPROVED BANNER -->
    <div class="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-6 shadow-xs">
      <div class="flex items-start gap-3">
        <div class="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5">
          <i data-lucide="badge-check" class="w-5 h-5"></i>
        </div>
        <div>
          <h3 class="font-bold text-emerald-900 text-base">Claim Verified & Approved</h3>
          <p class="text-emerald-800 text-xs mt-0.5">The finder has confirmed the claimant is the rightful owner. Please proceed with the physical handover.</p>
        </div>
      </div>
    </div>

    <!-- MATCH SUMMARY STATS -->
    <div class="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 mb-6">
      <h3 class="text-base font-bold text-slate-900 mb-4">Match Summary</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
          <p class="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Match ID</p>
          <p class="font-extrabold text-slate-900 text-lg mt-0.5">#${match_id}</p>
        </div>
        <div class="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
          <p class="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Similarity</p>
          <p class="font-extrabold text-emerald-600 text-lg mt-0.5">${escapeHtml(match.match_percentage)}%</p>
        </div>
        <div class="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
          <p class="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Post Status</p>
          <p class="font-bold text-slate-800 text-sm mt-1">${escapeHtml(match.status)}</p>
        </div>
        <div class="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
          <p class="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Claim Status</p>
          <span class="inline-block mt-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-xs">Approved</span>
        </div>
      </div>
    </div>

    <!-- RETURN CONFIRMATION & UNDO ACTIONS -->
    ${(is_owner || is_finder) ? `
    <div class="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 mb-6">
      <h3 class="text-base font-bold text-slate-900 mb-2">Item Handover & Return Status</h3>
      <div class="flex flex-wrap items-center justify-between gap-4 pt-2">
        <div>
          <p class="text-xs text-slate-600">
            Your Status: <strong class="text-slate-900">${is_owner ? (match.owner_status?.toLowerCase() === 'received' ? 'Returned' : 'Pending Confirmation') : (match.finder_status?.toLowerCase() === 'give back' ? 'Returned' : 'Pending Confirmation')}</strong>
            &nbsp;|&nbsp;
            Overall Handover: <strong class="text-slate-900">${match.status === 'Returned' ? '✓ Completed (Returned)' : 'In Progress'}</strong>
          </p>
          <p class="text-[11px] text-slate-400 mt-1">Confirm when the item has physically been handed over. You can undo if clicked accidentally.</p>
        </div>
        <div>
          ${is_owner ? (
            match.owner_status?.toLowerCase() === 'received' ? `
              <div class="flex items-center gap-2">
                <span class="px-3 py-1.5 bg-emerald-100 text-emerald-800 font-bold rounded-xl text-xs border border-emerald-300">✓ Returned</span>
                <form action="match-action.php" method="POST" class="inline-block">
                  <input type="hidden" name="match_id" value="${match_id}">
                  <input type="hidden" name="action" value="not_returned">
                  <button type="submit" class="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center gap-1" onclick="return confirm('Revert status back to Not Returned Yet?');">
                    <i data-lucide="undo" class="w-3.5 h-3.5"></i>
                    <span>↩ Not Returned Yet</span>
                  </button>
                </form>
              </div>
            ` : `
              <form action="match-action.php" method="POST" class="inline-block">
                <input type="hidden" name="match_id" value="${match_id}">
                <input type="hidden" name="action" value="received">
                <button type="submit" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center gap-1.5">
                  <i data-lucide="package-check" class="w-3.5 h-3.5"></i>
                  <span>Confirm Return</span>
                </button>
              </form>
            `
          ) : ''}
          ${is_finder ? (
            match.finder_status?.toLowerCase() === 'give back' ? `
              <div class="flex items-center gap-2">
                <span class="px-3 py-1.5 bg-emerald-100 text-emerald-800 font-bold rounded-xl text-xs border border-emerald-300">✓ Returned</span>
                <form action="match-action.php" method="POST" class="inline-block">
                  <input type="hidden" name="match_id" value="${match_id}">
                  <input type="hidden" name="action" value="not_returned">
                  <button type="submit" class="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center gap-1" onclick="return confirm('Revert status back to Not Returned Yet?');">
                    <i data-lucide="undo" class="w-3.5 h-3.5"></i>
                    <span>↩ Not Returned Yet</span>
                  </button>
                </form>
              </div>
            ` : `
              <form action="match-action.php" method="POST" class="inline-block">
                <input type="hidden" name="match_id" value="${match_id}">
                <input type="hidden" name="action" value="given_back">
                <button type="submit" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center gap-1.5">
                  <i data-lucide="handshake" class="w-3.5 h-3.5"></i>
                  <span>Confirm Return</span>
                </button>
              </form>
            `
          ) : ''}
        </div>
      </div>
    </div>
    ` : ''}

    <!-- TWO COLUMN: LOST ITEM & FOUND ITEM -->
    <div class="grid md:grid-cols-2 gap-6 mb-6">
      <!-- LOST ITEM -->
      <div class="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 class="text-base font-bold text-rose-600 flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
            Lost Item Details
          </h3>
          <span class="text-xs bg-rose-50 text-rose-700 font-bold px-2.5 py-0.5 rounded-full">Owner</span>
        </div>

        ${lostImage ? `
          <div class="w-full h-40 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center">
            <img src="${lostImage}" alt="${escapeHtml(match.lost_item_name)}" class="max-w-full max-h-full object-contain p-2">
          </div>
        ` : ''}

        <div class="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p class="text-slate-400 font-semibold">Item Name</p>
            <p class="font-bold text-slate-800 text-sm">${escapeHtml(match.lost_item_name)}</p>
          </div>
          <div>
            <p class="text-slate-400 font-semibold">Category</p>
            <p class="font-bold text-slate-800 text-sm">${escapeHtml(match.lost_category)}</p>
          </div>
          <div>
            <p class="text-slate-400 font-semibold">Lost Date</p>
            <p class="font-bold text-slate-800 text-sm">${escapeHtml(match.lost_date)}</p>
          </div>
          <div>
            <p class="text-slate-400 font-semibold">Lost Location</p>
            <p class="font-bold text-slate-800 text-sm">${escapeHtml(match.lost_location)}</p>
          </div>
          <div class="col-span-2">
            <p class="text-slate-400 font-semibold">Owner Contact</p>
            <p class="font-bold text-slate-800 text-sm font-mono">${escapeHtml(match.lost_contact_information)}</p>
          </div>
        </div>

        <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
          <p class="text-rose-600 text-[11px] font-bold uppercase mb-1">Description</p>
          <p class="text-slate-700 text-xs leading-relaxed whitespace-pre-wrap">${escapeHtml(match.lost_description || 'No description provided')}</p>
        </div>

        <div class="bg-amber-50 border border-amber-200 rounded-xl p-3.5">
          <p class="text-amber-800 text-[11px] font-bold uppercase mb-1">Owner Secret Information</p>
          <p class="text-slate-800 text-xs leading-relaxed whitespace-pre-wrap">${escapeHtml(match.lost_secret_information || match.secret_information || 'None provided')}</p>
        </div>
      </div>

      <!-- FOUND ITEM -->
      <div class="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 class="text-base font-bold text-emerald-600 flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            Found Item Details
          </h3>
          <span class="text-xs bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full">Finder</span>
        </div>

        <div class="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p class="text-slate-400 font-semibold">Item Name</p>
            <p class="font-bold text-slate-800 text-sm">${escapeHtml(match.found_item_name)}</p>
          </div>
          <div>
            <p class="text-slate-400 font-semibold">Category</p>
            <p class="font-bold text-slate-800 text-sm">${escapeHtml(match.found_category)}</p>
          </div>
          <div>
            <p class="text-slate-400 font-semibold">Found Date</p>
            <p class="font-bold text-slate-800 text-sm">${escapeHtml(match.found_date)}</p>
          </div>
          <div>
            <p class="text-slate-400 font-semibold">Found Location</p>
            <p class="font-bold text-slate-800 text-sm">${escapeHtml(match.found_location)}</p>
          </div>
          <div class="col-span-2">
            <p class="text-slate-400 font-semibold">Finder Contact</p>
            <p class="font-bold text-slate-800 text-sm font-mono">${escapeHtml(match.finder_contact_information)}</p>
          </div>
        </div>

        <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
          <p class="text-emerald-600 text-[11px] font-bold uppercase mb-1">Description</p>
          <p class="text-slate-700 text-xs leading-relaxed whitespace-pre-wrap">${escapeHtml(match.found_description || 'No description provided')}</p>
        </div>
      </div>
    </div>
  `;

  if (is_admin) {
    return renderAdminLayout({
      title: 'Approved Claim Details',
      activeNav: 'claims',
      admin_username,
      content
    });
  }

  return renderUserLayout({
    title: 'Approved Claim Details',
    activeNav: 'matches',
    full_name,
    unread_count,
    content
  });
}

module.exports = { renderApprovedClaimDetails };
