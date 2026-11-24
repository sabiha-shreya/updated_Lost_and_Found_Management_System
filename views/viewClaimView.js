const { escapeHtml } = require('../lib/auth');
const { renderUserLayout } = require('./layoutView');

function renderViewClaim({ match, claim, match_id, currentUserId, full_name = 'Student', unread_count = 0 }) {
  const m = match || claim || {};
  const id = match_id || m.match_id;
  const lostImage = m.lost_item_image ? escapeHtml(m.lost_item_image) : '';
  const foundImage = m.found_item_image || m.found_image ? escapeHtml(m.found_item_image || m.found_image) : '';
  const claimStatus = m.claim_status || 'Not Claimed';
  const percentage = parseFloat(m.match_percentage || 0).toFixed(2);
  const secretInfo = m.lost_secret_information || m.secret_information || '';

  if (claimStatus === 'Not Claimed') {
    const content = `
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-8 sm:p-12 text-center max-w-xl mx-auto my-8">
        <div class="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto mb-4">
          <i data-lucide="clock" class="w-8 h-8"></i>
        </div>
        <h3 class="text-xl font-extrabold text-slate-900 tracking-tight">No Claim Request Sent Yet</h3>
        <p class="text-sm text-slate-500 mt-2 leading-relaxed">
          The owner of the matching lost item has not submitted a claim request for this item yet.
        </p>
        <p class="text-xs text-slate-400 mt-2 leading-relaxed">
          Once the owner clicks <b>"Send Claim Request"</b> on their matches page, their claimer profile and secret verification details will appear here for you to verify and approve.
        </p>
        <div class="mt-6">
          <a href="my-matches.php" class="bg-[#003844] hover:bg-[#0fa4af] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 shadow-sm">
            <i data-lucide="arrow-left" class="w-4 h-4"></i>
            <span>Back to My Matches</span>
          </a>
        </div>
      </div>
    `;
    return renderUserLayout({
      title: 'Claim Review',
      activeNav: 'matches',
      full_name,
      unread_count,
      content
    });
  }

  const content = `
    <!-- HEADER -->
    <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div>
        <h2 class="text-2xl font-extrabold text-slate-900 tracking-tight">Claim Request Review</h2>
        <p class="text-sm text-slate-500 mt-1">Review the claimer's information and secret verification details before responding.</p>
      </div>

      <div class="flex items-center gap-3">
        <span class="px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold rounded-xl text-sm flex items-center gap-1.5 shadow-xs">
          <i data-lucide="sparkles" class="w-4 h-4 text-emerald-600"></i>
          <span>${percentage}% Match</span>
        </span>
        <span class="px-3.5 py-1.5 ${claimStatus === 'Approved' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : (claimStatus === 'Rejected' ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-amber-100 text-amber-800 border-amber-300')} border font-bold rounded-xl text-xs">
          ${escapeHtml(claimStatus)}
        </span>
      </div>
    </div>

    <!-- CLAIMER PROFILE INFORMATION -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-6 mb-6">
      <div class="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
        <div class="w-10 h-10 rounded-xl bg-teal-100 text-[#003844] flex items-center justify-center font-bold">
          <i data-lucide="user" class="w-5 h-5"></i>
        </div>
        <div>
          <h3 class="text-base font-bold text-slate-900">Claimer Profile Information</h3>
          <p class="text-xs text-slate-400">Details of the campus user requesting to claim this found item</p>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div class="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
          <p class="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Full Name</p>
          <p class="font-bold text-slate-900 text-sm mt-0.5">${escapeHtml(m.requester_name || 'N/A')}</p>
        </div>
        <div class="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
          <p class="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Student ID</p>
          <p class="font-bold text-slate-900 text-sm mt-0.5">${escapeHtml(m.requester_student_id || 'N/A')}</p>
        </div>
        <div class="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
          <p class="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Department</p>
          <p class="font-bold text-slate-900 text-sm mt-0.5">${escapeHtml(m.requester_department || 'N/A')}</p>
        </div>
        <div class="bg-slate-50 p-4 rounded-xl border border-slate-200/80 sm:col-span-2">
          <p class="text-slate-400 text-[11px] font-bold uppercase tracking-wider">University Email</p>
          <p class="font-semibold text-slate-900 text-sm mt-0.5">${escapeHtml(m.requester_email || 'N/A')}</p>
        </div>
        <div class="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
          <p class="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Contact Phone / Info</p>
          <p class="font-semibold text-slate-900 text-sm mt-0.5 font-mono">${escapeHtml(m.lost_contact_information || m.lost_contact || 'N/A')}</p>
        </div>
      </div>
    </div>

    <!-- SECRET INFORMATION VERIFICATION BOX -->
    <div class="bg-amber-50/70 border border-amber-300 rounded-2xl p-6 mb-6 shadow-xs">
      <div class="flex items-start gap-3.5 mb-3">
        <div class="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5">
          <i data-lucide="shield-check" class="w-5 h-5"></i>
        </div>
        <div>
          <h3 class="text-base font-bold text-amber-950">Secret Information (Owner Verification)</h3>
          <p class="text-amber-800 text-xs mt-0.5 leading-relaxed">
            This confidential detail was entered by the owner when posting the lost item. Cross-check this with the physical item you found (e.g. wallpapers, unique markings, serial numbers, engravings, internal contents).
          </p>
        </div>
      </div>
      <div class="bg-white rounded-xl p-4 border border-amber-200 mt-2">
        <p class="text-slate-900 font-semibold text-sm whitespace-pre-wrap">${secretInfo ? escapeHtml(secretInfo) : '<span class="text-slate-400 italic font-normal">No secret information was provided by the owner.</span>'}</p>
      </div>
    </div>

    <!-- ITEMS COMPARISON -->
    <div class="grid md:grid-cols-2 gap-6 mb-6">
      <!-- LOST ITEM -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-6 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h3 class="text-base font-bold text-rose-600 flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
              Claimed Lost Item
            </h3>
            <span class="text-xs bg-rose-50 text-rose-700 font-bold px-2.5 py-0.5 rounded-full">Lost Post</span>
          </div>

          ${lostImage ? `
            <div class="mb-4">
              <div class="w-full h-44 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center">
                <img src="${lostImage}" alt="${escapeHtml(m.lost_item_name)}" class="max-w-full max-h-full object-contain p-2">
              </div>
            </div>
          ` : ''}

          <div class="space-y-3">
            <div>
              <p class="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Item Name</p>
              <p class="font-bold text-slate-900 text-base">${escapeHtml(m.lost_item_name || m.lost_name)}</p>
            </div>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p class="text-slate-400 font-semibold">Category</p>
                <p class="font-bold text-slate-800">${escapeHtml(m.lost_category)}</p>
              </div>
              <div>
                <p class="text-slate-400 font-semibold">Lost Date</p>
                <p class="font-bold text-slate-800">${escapeHtml(m.lost_date)}</p>
              </div>
            </div>
            <div class="text-xs">
              <p class="text-slate-400 font-semibold">Lost Location</p>
              <p class="font-bold text-slate-800">${escapeHtml(m.lost_location)}</p>
            </div>
            <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <p class="text-rose-600 text-[11px] font-bold uppercase mb-1">Description</p>
              <p class="text-slate-700 text-xs leading-relaxed whitespace-pre-wrap">${escapeHtml(m.lost_description || 'No description provided')}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- FOUND ITEM -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-6 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h3 class="text-base font-bold text-emerald-600 flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              Your Found Item
            </h3>
            <span class="text-xs bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full">Found Post</span>
          </div>

          ${foundImage ? `
            <div class="mb-4">
              <div class="w-full h-44 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center">
                <img src="${foundImage}" alt="${escapeHtml(m.found_item_name)}" class="max-w-full max-h-full object-contain p-2">
              </div>
            </div>
          ` : ''}

          <div class="space-y-3">
            <div>
              <p class="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Item Name</p>
              <p class="font-bold text-slate-900 text-base">${escapeHtml(m.found_item_name || m.found_name)}</p>
            </div>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p class="text-slate-400 font-semibold">Category</p>
                <p class="font-bold text-slate-800">${escapeHtml(m.found_category)}</p>
              </div>
              <div>
                <p class="text-slate-400 font-semibold">Found Date</p>
                <p class="font-bold text-slate-800">${escapeHtml(m.found_date)}</p>
              </div>
            </div>
            <div class="text-xs">
              <p class="text-slate-400 font-semibold">Found Location</p>
              <p class="font-bold text-slate-800">${escapeHtml(m.found_location)}</p>
            </div>
            <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <p class="text-emerald-600 text-[11px] font-bold uppercase mb-1">Description</p>
              <p class="text-slate-700 text-xs leading-relaxed whitespace-pre-wrap">${escapeHtml(m.found_description || 'No description provided')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- CLAIM ACTIONS -->
    ${claimStatus === 'Pending' ? `
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-6">
        <h3 class="text-base font-bold text-slate-900 mb-1">Respond to Claim Request</h3>
        <p class="text-slate-500 mb-5 text-xs">After reviewing the claimer's identity and secret information, accept or reject this claim request.</p>
        <div class="flex flex-wrap gap-3">
          <form action="approve-claim.php" method="POST">
            <input type="hidden" name="match_id" value="${id}">
            <button type="submit" class="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs transition shadow-xs">
              <i data-lucide="check" class="w-4 h-4"></i>
              <span>Accept Claim Request</span>
            </button>
          </form>
          <form action="reject-claim.php" method="POST">
            <input type="hidden" name="match_id" value="${id}">
            <button type="submit" onclick="return confirm('Are you sure you want to reject this claim request?');" class="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs transition shadow-xs">
              <i data-lucide="x" class="w-4 h-4"></i>
              <span>Reject Claim Request</span>
            </button>
          </form>
        </div>
      </div>
    ` : ''}

    ${claimStatus === 'Approved' ? `
      <div class="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 class="text-base font-bold text-emerald-800 mb-1">✓ Claim Approved</h3>
          <p class="text-emerald-700 text-xs">You approved this claim request. Both parties can now proceed to return the item.</p>
        </div>
        <a href="approved-claim-details.php?match_id=${id}" class="inline-flex items-center gap-1.5 bg-[#003844] hover:bg-[#0fa4af] text-white px-5 py-2.5 rounded-xl font-bold text-xs transition shadow-xs">
          <i data-lucide="file-text" class="w-4 h-4"></i>
          <span>View Exchange Details</span>
        </a>
      </div>
    ` : ''}

    ${claimStatus === 'Rejected' ? `
      <div class="bg-rose-50 border border-rose-200 rounded-2xl p-6">
        <h3 class="text-base font-bold text-rose-800 mb-1">✕ Claim Rejected</h3>
        <p class="text-rose-700 text-xs">This claim request was rejected. The claimer has been notified.</p>
      </div>
    ` : ''}
  `;

  return renderUserLayout({
    title: 'Claim Request Review',
    activeNav: 'matches',
    full_name,
    unread_count,
    content
  });
}

module.exports = { renderViewClaim };
