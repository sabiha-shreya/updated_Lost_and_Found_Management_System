const { escapeHtml } = require('../lib/auth');
const { renderUserLayout } = require('./layoutView');

function renderMyMatches({ matches = [], user_id, full_name = 'Student', unread_count = 0 }) {
  user_id = parseInt(user_id, 10);

  const matchCardsHtml = (matches && matches.length > 0) ? matches.map(row => {
    const isOwner = parseInt(row.lost_user_id, 10) === user_id;
    const isFinder = parseInt(row.found_user_id, 10) === user_id;
    const matchId = parseInt(row.match_id, 10);
    const percentage = parseFloat(row.match_percentage).toFixed(2);
    let claimStatus = (row.claim_status || '').trim();
    if (!claimStatus) claimStatus = 'Not Claimed';

    const ownerStatus = (row.owner_status || '').trim().toLowerCase();
    const finderStatus = (row.finder_status || '').trim().toLowerCase();

    // Image for lost item
    const lostImgSrc = row.lost_item_image
      ? (row.lost_item_image.startsWith('data:') ? `image.php?type=lost&id=${encodeURIComponent(row.lost_id)}` : escapeHtml(row.lost_item_image))
      : null;
    const lostImageHtml = lostImgSrc
      ? `<div class="w-full h-40 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 mb-3.5">
           <img src="${lostImgSrc}" alt="Lost Item" class="w-full h-full object-cover">
         </div>`
      : '';

    // Action button area
    let actionHtml = '';
    if (isOwner) {
      if (claimStatus === 'Not Claimed') {
        actionHtml = `
          <form action="claim-item.php" method="POST" class="inline-block">
            <input type="hidden" name="match_id" value="${matchId}">
            <button type="submit" class="bg-[#003844] hover:bg-[#0fa4af] text-white px-4 py-2 rounded-xl font-bold text-xs transition shadow-sm flex items-center gap-1.5">
              <i data-lucide="send" class="w-3.5 h-3.5"></i>
              <span>Send Claim Request</span>
            </button>
          </form>`;
      } else if (claimStatus === 'Pending') {
        actionHtml = `<span class="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
          <i data-lucide="clock" class="w-3.5 h-3.5 text-amber-500"></i>
          <span>Claim Request Sent (Waiting for Finder)</span>
        </span>`;
      } else if (claimStatus === 'Rejected') {
        actionHtml = `<span class="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl">
          <i data-lucide="x-circle" class="w-3.5 h-3.5 text-rose-500"></i>
          <span>Claim Rejected by Finder</span>
        </span>`;
      } else if (claimStatus === 'Approved') {
        if (ownerStatus === 'received') {
          actionHtml = `
            <div class="flex items-center gap-2 flex-wrap">
              <span class="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-xl">
                <i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-600"></i>
                <span>✓ Returned</span>
              </span>
              <form action="match-action.php" method="POST" class="inline-block">
                <input type="hidden" name="match_id" value="${matchId}">
                <input type="hidden" name="action" value="not_returned">
                <button type="submit" class="bg-rose-500 hover:bg-rose-600 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1" onclick="return confirm('Revert status back to Not Returned Yet?');">
                  <i data-lucide="undo" class="w-3.5 h-3.5"></i>
                  <span>↩ Not Returned Yet</span>
                </button>
              </form>
              <a href="approved-claim-details.php?match_id=${matchId}" class="bg-[#003844] hover:bg-[#0fa4af] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition inline-flex items-center gap-1">
                <span>View Exchange</span>
              </a>
            </div>`;
        } else {
          actionHtml = `
            <div class="flex items-center gap-2 flex-wrap">
              <form action="match-action.php" method="POST" class="inline-block">
                <input type="hidden" name="match_id" value="${matchId}">
                <input type="hidden" name="action" value="received">
                <button type="submit" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5">
                  <i data-lucide="package-check" class="w-3.5 h-3.5"></i>
                  <span>Confirm Return</span>
                </button>
              </form>
              <a href="approved-claim-details.php?match_id=${matchId}" class="bg-[#003844] hover:bg-[#0fa4af] text-white px-4 py-2 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5">
                <span>View Exchange Details</span>
              </a>
            </div>`;
        }
      }
    } else if (isFinder) {
      if (claimStatus === 'Not Claimed') {
        actionHtml = `
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl font-medium">○ No Claim Request Yet</span>
            <a href="view-claim.php?match_id=${matchId}" class="bg-[#003844] hover:bg-[#0fa4af] text-white px-4 py-2 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5">
              <i data-lucide="user-check" class="w-3.5 h-3.5"></i>
              <span>View Claimer Data & Secret Info</span>
            </a>
          </div>`;
      } else if (claimStatus === 'Pending') {
        actionHtml = `
          <div class="flex items-center gap-2 flex-wrap">
            <span class="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
              <i data-lucide="bell-ring" class="w-3.5 h-3.5 text-amber-500"></i>
              <span>Claim Request Received!</span>
            </span>
            <a href="view-claim.php?match_id=${matchId}" class="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm inline-flex items-center gap-1.5">
              <i data-lucide="search" class="w-3.5 h-3.5"></i>
              <span>Review Claim & Secret Info</span>
            </a>
          </div>`;
      } else if (claimStatus === 'Rejected') {
        actionHtml = `
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl">✗ Claim Rejected</span>
            <a href="view-claim.php?match_id=${matchId}" class="bg-slate-700 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition">View Details</a>
          </div>`;
      } else if (claimStatus === 'Approved') {
        if (finderStatus === 'give back') {
          actionHtml = `
            <div class="flex items-center gap-2 flex-wrap">
              <span class="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-xl">
                <i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-600"></i>
                <span>✓ Returned</span>
              </span>
              <form action="match-action.php" method="POST" class="inline-block">
                <input type="hidden" name="match_id" value="${matchId}">
                <input type="hidden" name="action" value="not_returned">
                <button type="submit" class="bg-rose-500 hover:bg-rose-600 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1" onclick="return confirm('Revert status back to Not Returned Yet?');">
                  <i data-lucide="undo" class="w-3.5 h-3.5"></i>
                  <span>↩ Not Returned Yet</span>
                </button>
              </form>
              <a href="approved-claim-details.php?match_id=${matchId}" class="bg-[#003844] hover:bg-[#0fa4af] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition inline-flex items-center gap-1">
                <span>View Exchange</span>
              </a>
            </div>`;
        } else {
          actionHtml = `
            <div class="flex items-center gap-2 flex-wrap">
              <form action="match-action.php" method="POST" class="inline-block">
                <input type="hidden" name="match_id" value="${matchId}">
                <input type="hidden" name="action" value="given_back">
                <button type="submit" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5">
                  <i data-lucide="handshake" class="w-3.5 h-3.5"></i>
                  <span>Confirm Return</span>
                </button>
              </form>
              <a href="approved-claim-details.php?match_id=${matchId}" class="bg-[#003844] hover:bg-[#0fa4af] text-white px-4 py-2 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5">
                <span>View Exchange Details</span>
              </a>
            </div>`;
        }
      }
    }

    let claimBadge = '';
    if (row.status === 'Returned' || (ownerStatus === 'received' && finderStatus === 'give back')) {
      claimBadge = `<span class="inline-flex items-center gap-1 text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-full">✓ Returned</span>`;
    } else if (claimStatus === 'Approved') {
      if (ownerStatus === 'received') {
        claimBadge = `<span class="inline-flex items-center gap-1 text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full">📦 Received by Owner</span>`;
      } else if (finderStatus === 'give back') {
        claimBadge = `<span class="inline-flex items-center gap-1 text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200 px-3 py-1 rounded-full">🤝 Given Back by Finder</span>`;
      } else {
        claimBadge = `<span class="inline-flex items-center gap-1 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full">✓ Claim Approved</span>`;
      }
    } else if (claimStatus === 'Not Claimed') {
      claimBadge = `<span class="inline-flex items-center gap-1 text-xs font-medium bg-slate-100 text-slate-600 px-3 py-1 rounded-full">○ Not Claimed</span>`;
    } else if (claimStatus === 'Pending') {
      claimBadge = `<span class="inline-flex items-center gap-1 text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full">⏳ Claim Pending</span>`;
    } else if (claimStatus === 'Rejected') {
      claimBadge = `<span class="inline-flex items-center gap-1 text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded-full">✗ Claim Rejected</span>`;
    } else {
      claimBadge = `<span class="inline-flex items-center gap-1 text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">${escapeHtml(claimStatus)}</span>`;
    }

    const lostName = row.lost_item_name || row.lost_name || 'Lost Item';
    const foundName = row.found_item_name || row.found_name || 'Found Item';

    return `
      <div class="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition overflow-hidden">
        <!-- MATCH HEADER -->
        <div class="px-6 py-4 bg-slate-50/70 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <span class="font-extrabold text-slate-900 text-sm">Match #${matchId}</span>
            ${isOwner ? '<span class="bg-rose-100 text-rose-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full">👤 You are Owner</span>' : ''}
            ${isFinder ? '<span class="bg-emerald-100 text-emerald-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full">🔎 You are Finder</span>' : ''}
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold bg-emerald-500 text-white px-3 py-1 rounded-full shadow-xs flex items-center gap-1">
              <i data-lucide="sparkles" class="w-3 h-3"></i>
              <span>${percentage}% Match</span>
            </span>
          </div>
        </div>

        <!-- SCORE BREAKDOWN CHIPS -->
        <div class="px-6 py-3 bg-teal-50/40 border-b border-teal-100/60 flex flex-wrap items-center gap-3 text-xs text-slate-600">
          <span class="font-bold text-teal-900 flex items-center gap-1">
            <i data-lucide="sliders" class="w-3.5 h-3.5 text-teal-700"></i>
            <span>Match Weights:</span>
          </span>
          <span class="bg-white px-2 py-0.5 rounded-lg border border-teal-200/80 font-medium text-slate-700">
            Name (40%): <b>${escapeHtml(row.item_name_score || 0)}%</b>
          </span>
          <span class="bg-white px-2 py-0.5 rounded-lg border border-teal-200/80 font-medium text-slate-700">
            Category (25%): <b>${escapeHtml(row.category_score || 0)}%</b>
          </span>
          <span class="bg-white px-2 py-0.5 rounded-lg border border-teal-200/80 font-medium text-slate-700">
            Location (25%): <b>${escapeHtml(row.location_score || 0)}%</b>
          </span>
          <span class="bg-white px-2 py-0.5 rounded-lg border border-teal-200/80 font-medium text-slate-700">
            Date (10%): <b>${escapeHtml(row.date_score || 0)}%</b>
          </span>
        </div>

        <!-- ITEMS SIDE BY SIDE -->
        <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- LOST ITEM COLUMN -->
          <div class="bg-rose-50/30 rounded-2xl p-5 border border-rose-100 flex flex-col justify-between">
            <div>
              <div class="flex items-center gap-2 mb-2">
                <span class="w-2 h-2 rounded-full bg-rose-500"></span>
                <span class="text-[11px] font-extrabold uppercase tracking-wider text-rose-600">LOST ITEM</span>
              </div>
              <h3 class="text-lg font-bold text-slate-900 mb-3">${escapeHtml(lostName)}</h3>
              ${lostImageHtml}
              <div class="space-y-2 text-xs">
                <div class="flex justify-between py-1 border-b border-rose-100">
                  <span class="text-slate-500 font-semibold">Category:</span>
                  <span class="font-medium text-slate-800">${escapeHtml(row.lost_category)}</span>
                </div>
                <div class="flex justify-between py-1 border-b border-rose-100">
                  <span class="text-slate-500 font-semibold">Date Lost:</span>
                  <span class="font-medium text-slate-800">${escapeHtml(row.lost_date)}</span>
                </div>
                <div class="flex justify-between py-1 border-b border-rose-100">
                  <span class="text-slate-500 font-semibold">Location:</span>
                  <span class="font-medium text-slate-800">${escapeHtml(row.lost_location)}</span>
                </div>
              </div>
            </div>

            <!-- DESCRIPTION -->
            <div class="mt-4 pt-3 border-t border-rose-100/80">
              <span class="text-[10px] font-bold text-rose-600 uppercase tracking-wider block mb-1">Description</span>
              <p class="text-xs text-slate-700 bg-white p-3 rounded-xl border border-rose-100 leading-relaxed whitespace-pre-wrap">${escapeHtml(row.lost_description || 'No description provided')}</p>
            </div>
          </div>

          <!-- FOUND ITEM COLUMN -->
          <div class="bg-emerald-50/30 rounded-2xl p-5 border border-emerald-100 flex flex-col justify-between">
            <div>
              <div class="flex items-center gap-2 mb-2">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span class="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600">FOUND ITEM</span>
              </div>
              <h3 class="text-lg font-bold text-slate-900 mb-3">${escapeHtml(foundName)}</h3>
              <div class="space-y-2 text-xs">
                <div class="flex justify-between py-1 border-b border-emerald-100">
                  <span class="text-slate-500 font-semibold">Category:</span>
                  <span class="font-medium text-slate-800">${escapeHtml(row.found_category)}</span>
                </div>
                <div class="flex justify-between py-1 border-b border-emerald-100">
                  <span class="text-slate-500 font-semibold">Date Found:</span>
                  <span class="font-medium text-slate-800">${escapeHtml(row.found_date)}</span>
                </div>
                <div class="flex justify-between py-1 border-b border-emerald-100">
                  <span class="text-slate-500 font-semibold">Location:</span>
                  <span class="font-medium text-slate-800">${escapeHtml(row.found_location)}</span>
                </div>
              </div>
            </div>

            <!-- DESCRIPTION -->
            <div class="mt-4 pt-3 border-t border-emerald-100/80">
              <span class="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">Description</span>
              <p class="text-xs text-slate-700 bg-white p-3 rounded-xl border border-emerald-100 leading-relaxed whitespace-pre-wrap">${escapeHtml(row.found_description || 'No description provided')}</p>
            </div>
          </div>
        </div>

        <!-- FOOTER ACTIONS -->
        <div class="px-6 py-4 bg-slate-50/80 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-500 font-semibold uppercase tracking-wider">Status:</span>
            ${claimBadge}
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            ${actionHtml}
          </div>
        </div>
      </div>
    `;
  }).join('') : `
    <div class="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
      <div class="w-16 h-16 rounded-2xl bg-teal-50 text-[#003844] flex items-center justify-center mx-auto mb-4">
        <i data-lucide="sparkles" class="w-8 h-8 text-[#0fa4af]"></i>
      </div>
      <h3 class="text-lg font-bold text-slate-900 mb-1">No Matches Found Yet</h3>
      <p class="text-sm text-slate-500 max-w-md mx-auto">
        When our automated system detects matching lost and found items with <b>80% or higher similarity</b>, they will immediately appear here.
      </p>
      <div class="mt-6 flex justify-center gap-3">
        <a href="add-lost-item.php" class="bg-[#003844] hover:bg-[#0fa4af] text-white px-4 py-2 rounded-xl text-xs font-bold transition">Report Lost Item</a>
        <a href="view-items.php" class="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition">Browse All Items</a>
      </div>
    </div>
  `;

  const content = `
    <!-- HEADER -->
    <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div>
        <h2 class="text-2xl font-extrabold text-slate-900 tracking-tight">My Matches</h2>
        <p class="text-sm text-slate-500 mt-1">High-confidence matches (&ge; 80%) calculated from item name, category, location, and date.</p>
      </div>
      <a href="dashboard.php" class="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl font-semibold transition inline-flex items-center gap-1.5">
        <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i>
        <span>Dashboard</span>
      </a>
    </div>

    <!-- MATCHES LIST -->
    <div class="space-y-6">
      ${matchCardsHtml}
    </div>
  `;

  return renderUserLayout({
    title: 'My Matches',
    activeNav: 'matches',
    full_name,
    unread_count,
    content
  });
}

module.exports = { renderMyMatches };
