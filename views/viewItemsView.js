const { escapeHtml } = require('../lib/auth');
const { renderUserLayout } = require('./layoutView');

function renderViewItems({ type = 'all', lost_items = [], found_items = [], full_name = 'Student', unread_count = 0, is_logged_in = true }) {
  const pageTitle = type === 'lost' ? 'Lost Items' : (type === 'found' ? 'Found Items' : 'View All Items');

  const lostRows = (lost_items && lost_items.length > 0)
    ? lost_items.map(row => {
        const id = encodeURIComponent(row.lost_id);
        const imgSrc = row.item_image
          ? (row.item_image.startsWith('data:') ? `image.php?type=lost&id=${id}` : escapeHtml(row.item_image))
          : null;
        const img = imgSrc
          ? `<img src="${imgSrc}" class="w-12 h-12 object-cover rounded-lg border border-slate-200 cursor-pointer hover:scale-105 transition" onclick="event.stopPropagation(); showImage(this.src);" alt="Item">`
          : '<span class="text-xs text-slate-400 italic">No image</span>';

        return `
          <tr class="item-row hover:bg-slate-50/80 cursor-pointer transition border-b border-slate-100" data-type="lost" data-search="${escapeHtml((row.item_name + ' ' + row.category + ' ' + row.lost_location + ' ' + row.description).toLowerCase())}" onclick="window.location='item-details.php?id=${id}&type=lost&from=items'">
            <td class="py-3.5 px-4 font-bold text-slate-900 text-xs">#${escapeHtml(row.lost_id)}</td>
            <td class="py-3.5 px-4">
              <div class="flex items-center gap-3">
                ${img}
                <div>
                  <p class="font-bold text-sm text-slate-900">${escapeHtml(row.item_name)}</p>
                  <p class="text-xs text-slate-500 line-clamp-1 max-w-xs">${escapeHtml(row.description || '')}</p>
                </div>
              </div>
            </td>
            <td class="py-3.5 px-4">
              <span class="inline-block bg-teal-50 text-teal-700 border border-teal-200 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                ${escapeHtml(row.category)}
              </span>
            </td>
            <td class="py-3.5 px-4 text-xs text-slate-600">${escapeHtml(row.lost_date)}</td>
            <td class="py-3.5 px-4 text-xs text-slate-600">
              <span class="inline-flex items-center gap-1">
                <i data-lucide="map-pin" class="w-3.5 h-3.5 text-slate-400"></i>
                <span>${escapeHtml(row.lost_location)}</span>
              </span>
            </td>
            <td class="py-3.5 px-4 text-xs text-slate-600 font-mono">${escapeHtml(row.contact_information)}</td>
            <td class="py-3.5 px-4">
              <span class="inline-block bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2.5 py-0.5 rounded-full font-bold">
                ${escapeHtml(row.status)}
              </span>
            </td>
          </tr>
        `;
      }).join('')
    : `<tr><td colspan="7" class="py-8 text-center text-slate-400 text-sm">No Lost Items Found</td></tr>`;

  const foundRows = (found_items && found_items.length > 0)
    ? found_items.map(row => {
        const id = encodeURIComponent(row.found_id);
        const imgSrc = row.item_image
          ? (row.item_image.startsWith('data:') ? `image.php?type=found&id=${id}` : escapeHtml(row.item_image))
          : null;
        const img = imgSrc
          ? `<img src="${imgSrc}" class="w-12 h-12 object-cover rounded-lg border border-slate-200 cursor-pointer hover:scale-105 transition" onclick="event.stopPropagation(); showImage(this.src);" alt="Item">`
          : '<span class="text-xs text-slate-400 italic">No image</span>';

        return `
          <tr class="item-row hover:bg-slate-50/80 cursor-pointer transition border-b border-slate-100" data-type="found" data-search="${escapeHtml((row.item_name + ' ' + row.category + ' ' + row.found_location + ' ' + row.description).toLowerCase())}" onclick="window.location='item-details.php?id=${id}&type=found&from=items'">
            <td class="py-3.5 px-4 font-bold text-slate-900 text-xs">#${escapeHtml(row.found_id)}</td>
            <td class="py-3.5 px-4">
              <div class="flex items-center gap-3">
                ${img}
                <div>
                  <p class="font-bold text-sm text-slate-900">${escapeHtml(row.item_name)}</p>
                  <p class="text-xs text-slate-500 line-clamp-1 max-w-xs">${escapeHtml(row.description || '')}</p>
                </div>
              </div>
            </td>
            <td class="py-3.5 px-4">
              <span class="inline-block bg-teal-50 text-teal-700 border border-teal-200 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                ${escapeHtml(row.category)}
              </span>
            </td>
            <td class="py-3.5 px-4 text-xs text-slate-600">${escapeHtml(row.found_date)}</td>
            <td class="py-3.5 px-4 text-xs text-slate-600">
              <span class="inline-flex items-center gap-1">
                <i data-lucide="map-pin" class="w-3.5 h-3.5 text-slate-400"></i>
                <span>${escapeHtml(row.found_location)}</span>
              </span>
            </td>
            <td class="py-3.5 px-4 text-xs text-slate-600 font-mono">${escapeHtml(row.finder_contact_information)}</td>
            <td class="py-3.5 px-4">
              <span class="inline-block bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2.5 py-0.5 rounded-full font-bold">
                ${escapeHtml(row.status)}
              </span>
            </td>
          </tr>
        `;
      }).join('')
    : `<tr><td colspan="7" class="py-8 text-center text-slate-400 text-sm">No Found Items Found</td></tr>`;

  const content = `
    <!-- TOP BAR CONTROLS -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h2 class="text-2xl font-extrabold text-slate-900 tracking-tight">${escapeHtml(pageTitle)}</h2>
        <p class="text-sm text-slate-500 mt-1">Browse all verified lost and found item reports on campus.</p>
      </div>

      <div class="flex items-center gap-3">
        <!-- SEARCH FILTER -->
        <div class="relative">
          <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-3"></i>
          <input type="text" id="tableFilter" placeholder="Filter items..." onkeyup="filterTable()"
                 class="pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0fa4af] focus:border-[#0fa4af] w-48 sm:w-64 transition">
        </div>

        <!-- TAB SWITCHER -->
        <div class="inline-flex p-1 bg-slate-200/80 rounded-xl text-xs font-bold text-slate-600">
          <a href="view-items.php?type=all" class="px-3 py-1.5 rounded-lg transition ${type === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}">All</a>
          <a href="view-items.php?type=lost" class="px-3 py-1.5 rounded-lg transition ${type === 'lost' ? 'bg-white text-rose-600 shadow-xs' : 'hover:text-slate-900'}">Lost</a>
          <a href="view-items.php?type=found" class="px-3 py-1.5 rounded-lg transition ${type === 'found' ? 'bg-white text-emerald-600 shadow-xs' : 'hover:text-slate-900'}">Found</a>
        </div>
      </div>
    </div>

    <!-- SECTIONS -->
    <div class="space-y-8">
      ${(type === 'all' || type === 'lost') ? `
      <!-- LOST ITEMS SECTION -->
      <div class="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div class="bg-gradient-to-r from-rose-50 to-white px-6 py-4 border-b border-rose-100 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <h3 class="font-bold text-base text-slate-900">Lost Items Directory</h3>
          </div>
          <span class="text-xs font-semibold text-rose-700 bg-rose-100/70 px-3 py-1 rounded-full">
            ${lost_items.length} Reports
          </span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse" id="lostTable">
            <thead>
              <tr class="border-b border-slate-200 bg-slate-50/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th class="py-3 px-4">ID</th>
                <th class="py-3 px-4">Item & Description</th>
                <th class="py-3 px-4">Category</th>
                <th class="py-3 px-4">Date Lost</th>
                <th class="py-3 px-4">Location</th>
                <th class="py-3 px-4">Contact</th>
                <th class="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              ${lostRows}
            </tbody>
          </table>
        </div>
      </div>
      ` : ''}

      ${(type === 'all' || type === 'found') ? `
      <!-- FOUND ITEMS SECTION -->
      <div class="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div class="bg-gradient-to-r from-emerald-50 to-white px-6 py-4 border-b border-emerald-100 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <h3 class="font-bold text-base text-slate-900">Found Items Directory</h3>
          </div>
          <span class="text-xs font-semibold text-emerald-700 bg-emerald-100/70 px-3 py-1 rounded-full">
            ${found_items.length} Reports
          </span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse" id="foundTable">
            <thead>
              <tr class="border-b border-slate-200 bg-slate-50/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th class="py-3 px-4">ID</th>
                <th class="py-3 px-4">Item & Description</th>
                <th class="py-3 px-4">Category</th>
                <th class="py-3 px-4">Date Found</th>
                <th class="py-3 px-4">Location</th>
                <th class="py-3 px-4">Finder Contact</th>
                <th class="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              ${foundRows}
            </tbody>
          </table>
        </div>
      </div>
      ` : ''}
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
      function filterTable() {
        const query = (document.getElementById('tableFilter').value || '').toLowerCase().trim();
        const rows = document.querySelectorAll('.item-row');
        rows.forEach(r => {
          const text = r.getAttribute('data-search') || '';
          if (!query || text.includes(query)) {
            r.style.display = '';
          } else {
            r.style.display = 'none';
          }
        });
      }
    </script>
  `;

  return renderUserLayout({
    title: pageTitle,
    activeNav: 'view-items',
    full_name,
    unread_count,
    content,
    scripts
  });
}

module.exports = { renderViewItems };
