const { escapeHtml } = require('../lib/auth');
const { renderUserLayout } = require('./layoutView');

function renderItemDetails({ item, type, from, full_name = 'Student', unread_count = 0, is_logged_in = true }) {
  const isLost = type === 'lost';
  const title = isLost ? 'Lost Item Details' : 'Found Item Details';
  const subtitle = isLost ? 'Full report of the lost item' : 'Full report of the found item';
  const dateLabel = isLost ? 'Lost Date' : 'Found Date';
  const dateValue = isLost ? item.lost_date : item.found_date;
  const locationValue = isLost ? item.lost_location : item.found_location;
  const contactLabel = isLost ? 'Contact Information' : 'Finder Contact';
  const contactValue = isLost ? item.contact_information : item.finder_contact_information;
  const backHref = from === 'items' ? 'view-items.php' : 'dashboard.php';
  const backText = from === 'items' ? 'Back to Items' : 'Back to Dashboard';

  const imgSrc = (item.item_image && item.item_image.startsWith('data:'))
    ? `image.php?type=${encodeURIComponent(type)}&id=${encodeURIComponent(isLost ? item.lost_id : item.found_id)}`
    : (item.item_image ? escapeHtml(item.item_image) : '');

  const imageHtml = imgSrc
    ? `<div class="w-full max-w-sm mx-auto h-64 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xs cursor-pointer hover:shadow-md transition" onclick="showImage(this.querySelector('img').src)">
         <img src="${imgSrc}" class="w-full h-full object-cover" alt="${escapeHtml(item.item_name)}">
       </div>`
    : `<div class="w-full max-w-sm mx-auto h-44 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
         <i data-lucide="image-off" class="w-8 h-8 mb-2 text-slate-300"></i>
         <span class="text-xs font-semibold">No Image Provided</span>
       </div>`;

  const content = `
    <!-- HEADER -->
    <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div>
        <div class="flex items-center gap-2.5">
          <span class="w-3 h-3 rounded-full ${isLost ? 'bg-rose-500' : 'bg-emerald-500'}"></span>
          <h2 class="text-2xl font-extrabold text-slate-900 tracking-tight">${escapeHtml(title)}</h2>
        </div>
        <p class="text-sm text-slate-500 mt-1">${escapeHtml(subtitle)}</p>
      </div>

      <a href="${backHref}" class="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl font-semibold transition inline-flex items-center gap-1.5">
        <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i>
        <span>${escapeHtml(backText)}</span>
      </a>
    </div>

    <!-- MAIN DETAIL CARD -->
    <div class="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
      <!-- TOP ACCENT -->
      <div class="px-6 py-4 ${isLost ? 'bg-rose-50/70 border-b border-rose-100' : 'bg-emerald-50/70 border-b border-emerald-100'} flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold ${isLost ? 'text-rose-700' : 'text-emerald-700'} uppercase tracking-wider">
            ${isLost ? 'Lost Item Post' : 'Found Item Post'} #${escapeHtml(item.lost_id || item.found_id || '')}
          </span>
        </div>
        <span class="text-xs font-bold px-3 py-1 rounded-full ${item.status === 'Returned' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-700'}">
          ${escapeHtml(item.status || 'Active')}
        </span>
      </div>

      <div class="p-6 md:p-8 space-y-8">
        <!-- IMAGE SECTION -->
        <div class="text-center">
          ${imageHtml}
        </div>

        <!-- DETAILS GRID -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div class="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80">
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Item Name</span>
            <p class="text-sm font-bold text-slate-900">${escapeHtml(item.item_name)}</p>
          </div>

          <div class="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80">
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Category</span>
            <p class="text-sm font-semibold text-slate-800">${escapeHtml(item.category)}</p>
          </div>

          <div class="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80">
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">${escapeHtml(dateLabel)}</span>
            <p class="text-sm font-semibold text-slate-800">${escapeHtml(dateValue)}</p>
          </div>

          <div class="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 sm:col-span-2">
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Location</span>
            <p class="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
              <i data-lucide="map-pin" class="w-4 h-4 text-slate-400"></i>
              <span>${escapeHtml(locationValue)}</span>
            </p>
          </div>

          <div class="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80">
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">${escapeHtml(contactLabel)}</span>
            <p class="text-sm font-semibold text-slate-800 font-mono">${escapeHtml(contactValue)}</p>
          </div>

          <div class="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 col-span-full">
            <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Description</span>
            <p class="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">${escapeHtml(item.description || 'No description provided.')}</p>
          </div>
        </div>

        <!-- FOOTER ACTIONS -->
        <div class="pt-6 border-t border-slate-100 flex items-center justify-between">
          <a href="${backHref}" class="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold transition inline-flex items-center gap-1.5">
            <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i>
            <span>${escapeHtml(backText)}</span>
          </a>

          <a href="search-item.html" class="text-xs bg-[#003844] hover:bg-[#0fa4af] text-white px-4 py-2.5 rounded-xl font-bold transition inline-flex items-center gap-1.5 shadow-xs">
            <i data-lucide="search" class="w-3.5 h-3.5"></i>
            <span>Search More Items</span>
          </a>
        </div>
      </div>
    </div>

    <!-- IMAGE LIGHTBOX MODAL -->
    <div id="imageModal" class="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4" onclick="closeImage()">
      <div class="relative max-w-2xl w-full text-center" onclick="event.stopPropagation()">
        <img id="modalImg" src="" alt="Full view" class="max-h-[85vh] max-w-full rounded-2xl shadow-2xl mx-auto border-2 border-white/20">
        <button onclick="closeImage()" class="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white text-slate-800 flex items-center justify-center font-bold shadow-lg hover:bg-slate-200 transition">
          ✕
        </button>
      </div>
    </div>
  `;

  const scripts = `
    <script>
      function showImage(src) {
        document.getElementById('modalImg').src = src;
        document.getElementById('imageModal').classList.remove('hidden');
      }
      function closeImage() {
        document.getElementById('imageModal').classList.add('hidden');
      }
    </script>
  `;

  return renderUserLayout({
    title,
    activeNav: 'view-items',
    full_name,
    unread_count,
    content,
    scripts
  });
}

module.exports = { renderItemDetails };
