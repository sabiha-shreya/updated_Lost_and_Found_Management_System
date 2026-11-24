const { getItemGraphic } = require('../lib/graphics');
const { escapeHtml } = require('../lib/auth');

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function renderDashboard({ full_name, unread_count, lost_items, found_items, recent_all_items }) {
  // Fallbacks if empty
  if (!lost_items || lost_items.length === 0) {
    lost_items = [
      { lost_id: 1, item_name: 'Black Wallet', lost_location: 'Library, Building 2', lost_date: '2025-05-30', item_image: null },
      { lost_id: 2, item_name: 'University ID Card', lost_location: 'Main Gate', lost_date: '2025-05-28', item_image: null },
      { lost_id: 3, item_name: 'Headphones', lost_location: 'Cafeteria', lost_date: '2025-05-27', item_image: null },
      { lost_id: 4, item_name: 'Math Textbook', lost_location: 'Room 301', lost_date: '2025-05-26', item_image: null },
      { lost_id: 5, item_name: 'Silver Watch', lost_location: 'Playground', lost_date: '2025-05-25', item_image: null }
    ];
  }

  if (!recent_all_items || recent_all_items.length === 0) {
    recent_all_items = [
      { id: 1, item_type: 'found', item_name: 'Water Bottle', category: 'Others', location: 'Cafeteria', post_date: '2025-05-29', item_image: null },
      { id: 2, item_type: 'found', item_name: 'Key with Keychain', category: 'Accessories', location: 'Parking Area', post_date: '2025-05-28', item_image: null },
      { id: 3, item_type: 'found', item_name: 'Black Umbrella', category: 'Others', location: 'Library, Floor 1', post_date: '2025-05-27', item_image: null },
      { id: 4, item_type: 'found', item_name: 'Power Bank', category: 'Electronics', location: 'Lab 404', post_date: '2025-05-26', item_image: null },
      { id: 5, item_type: 'found', item_name: 'Blue Notebook', category: 'Books/Stationery', location: 'Seminar Room', post_date: '2025-05-25', item_image: null }
    ];
  }

  if (!found_items || found_items.length === 0) {
    found_items = [
      { found_id: 1, item_name: 'Water Bottle', found_location: 'Cafeteria', found_date: '2025-05-29' },
      { found_id: 2, item_name: 'Key with Keychain', found_location: 'Parking Area', found_date: '2025-05-28' },
      { found_id: 3, item_name: 'Black Umbrella', found_location: 'Library, Floor 1', found_date: '2025-05-27' },
      { found_id: 4, item_name: 'Power Bank', found_location: 'Lab 404', found_date: '2025-05-26' },
      { found_id: 5, item_name: 'Blue Notebook', found_location: 'Seminar Room', found_date: '2025-05-25' }
    ];
  }

  const lostRowsHtml = lost_items.map(item => `
    <div class="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-50 transition">
      <div class="flex items-center gap-3 min-w-0">
        <div class="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
          ${item.item_image ? `<img src="${item.item_image.startsWith('data:') ? `image.php?type=lost&id=${encodeURIComponent(item.lost_id)}` : escapeHtml(item.item_image)}" alt="${escapeHtml(item.item_name)}" class="w-full h-full object-cover rounded-xl">` : getItemGraphic(item.item_name)}
        </div>
        <div class="truncate">
          <h4 class="text-xs font-bold text-slate-800 truncate">${escapeHtml(item.item_name)}</h4>
          <p class="text-[10.5px] text-slate-400 font-medium truncate mt-0.5">
            ${escapeHtml(item.lost_location)} • ${formatDate(item.lost_date)}
          </p>
        </div>
      </div>
      <a href="item-details.php?type=lost&id=${encodeURIComponent(item.lost_id)}" class="shrink-0 text-xs font-bold px-3 py-1 text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50 transition">
        View
      </a>
    </div>
  `).join('');

  const recentRowsHtml = recent_all_items.map(item => {
    const isLost = item.item_type === 'lost';
    return `
      <div class="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-50 transition">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
            ${item.item_image ? `<img src="${item.item_image.startsWith('data:') ? `image.php?type=${encodeURIComponent(item.item_type)}&id=${encodeURIComponent(item.id)}` : escapeHtml(item.item_image)}" alt="${escapeHtml(item.item_name)}" class="w-full h-full object-cover rounded-xl">` : getItemGraphic(item.item_name)}
          </div>
          <div class="truncate">
            <div class="flex items-center gap-1.5">
              <h4 class="text-xs font-bold text-slate-800 truncate">${escapeHtml(item.item_name)}</h4>
              <span class="text-[9.5px] font-bold px-1.5 py-0.5 rounded-md ${isLost ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}">
                ${isLost ? 'Lost' : 'Found'}
              </span>
            </div>
            <p class="text-[10.5px] text-slate-400 font-medium truncate mt-0.5">
              ${escapeHtml(item.location || item.lost_location || item.found_location)} • ${formatDate(item.post_date || item.lost_date || item.found_date)}
            </p>
          </div>
        </div>
        <a href="item-details.php?type=${encodeURIComponent(item.item_type)}&id=${encodeURIComponent(item.id)}" class="shrink-0 text-xs font-bold px-3 py-1 text-teal-700 border border-teal-200 rounded-lg hover:bg-teal-50 transition">
          View
        </a>
      </div>
    `;
  }).join('');

  const foundRowsHtml = found_items.map(item => `
    <div class="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-50 transition">
      <div class="flex items-center gap-3 min-w-0">
        <div class="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
          ${item.item_image ? `<img src="${item.item_image.startsWith('data:') ? `image.php?type=found&id=${encodeURIComponent(item.found_id)}` : escapeHtml(item.item_image)}" alt="${escapeHtml(item.item_name)}" class="w-full h-full object-cover rounded-xl">` : getItemGraphic(item.item_name)}
        </div>
        <div class="truncate">
          <h4 class="text-xs font-bold text-slate-800 truncate">${escapeHtml(item.item_name)}</h4>
          <p class="text-[10.5px] text-slate-400 font-medium truncate mt-0.5">
            ${escapeHtml(item.found_location)} • ${formatDate(item.found_date)}
          </p>
        </div>
      </div>
      <a href="item-details.php?type=found&id=${encodeURIComponent(item.found_id)}" class="shrink-0 text-xs font-bold px-3 py-1 text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition">
        View
      </a>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Campus Lost & Found Management System</title>
    <script src="js/tailwind.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="dashboard.css">
    <link rel="stylesheet" href="css/dashboard.css">
    <script src="js/lucide.js"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
</head>

<body class="flex h-screen overflow-hidden text-slate-800 antialiased selection:bg-teal-500 selection:text-white">

<!-- SIDEBAR -->
<aside id="mobileSidebar" class="fixed lg:static inset-y-0 left-0 z-50 lg:z-auto w-64 bg-[#003844] text-white flex flex-col justify-between p-5 shrink-0 hidden lg:flex select-none">
    <div>
        <div class="flex items-center gap-3.5 mb-8 px-1">
            <img src="images/new-logo.jpeg" alt="CAMPUS LOST & FOUND" class="h-10 w-auto object-contain rounded-xl">
        </div>

        <nav class="space-y-1.5 font-semibold text-sm">
            <a href="dashboard.php" class="flex items-center gap-3.5 px-4 py-3 bg-[#0fa4af] text-white rounded-xl shadow-md transition">
                <i data-lucide="layout-dashboard" class="w-4 h-4 text-white"></i>
                <span>Dashboard</span>
            </a>

            <a href="add-lost-item.php" class="flex items-center gap-3.5 px-4 py-3 text-teal-100/70 hover:text-white hover:bg-white/10 rounded-xl transition">
                <i data-lucide="plus-circle" class="w-4 h-4"></i>
                <span>Add Lost Item</span>
            </a>

            <a href="add-found-item.php" class="flex items-center gap-3.5 px-4 py-3 text-teal-100/70 hover:text-white hover:bg-white/10 rounded-xl transition">
                <i data-lucide="plus-square" class="w-4 h-4"></i>
                <span>Add Found Item</span>
            </a>

            <a href="search-item.html" class="flex items-center gap-3.5 px-4 py-3 text-teal-100/70 hover:text-white hover:bg-white/10 rounded-xl transition">
                <i data-lucide="search" class="w-4 h-4"></i>
                <span>Search Item</span>
            </a>

            <a href="view-items.php" class="flex items-center gap-3.5 px-4 py-3 text-teal-100/70 hover:text-white hover:bg-white/10 rounded-xl transition">
                <i data-lucide="clipboard-list" class="w-4 h-4"></i>
                <span>View All Items</span>
            </a>

            <a href="my-matches.php" class="flex items-center gap-3.5 px-4 py-3 text-teal-100/70 hover:text-white hover:bg-white/10 rounded-xl transition">
                <i data-lucide="heart" class="w-4 h-4"></i>
                <span>My Matches</span>
            </a>

            <a href="notifications.php" class="flex items-center justify-between px-4 py-3 text-teal-100/70 hover:text-white hover:bg-white/10 rounded-xl transition">
                <div class="flex items-center gap-3.5">
                    <i data-lucide="bell" class="w-4 h-4"></i>
                    <span>Notifications</span>
                </div>
                ${unread_count > 0 ? `
                <span class="bg-emerald-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                    ${unread_count}
                </span>` : ''}
            </a>
        </nav>
    </div>

    <div class="pt-4 text-center">
        <div class="relative mx-auto flex items-center justify-center mb-1">
            <img src="images/box.jpeg" alt="Lost Box Artwork" class="w-36 h-auto object-contain rounded-2xl drop-shadow-xl mx-auto">
        </div>

        <p class="text-xs text-teal-200/90 font-normal leading-relaxed italic mt-2">
            "Let's help return<br>what truly matters."
        </p>

        <div class="mt-3">
            <a href="logout.php" class="text-xs text-rose-300 hover:text-rose-200 bg-rose-950/40 border border-rose-800/40 px-3 py-1 rounded-lg transition inline-flex items-center gap-1.5 font-semibold">
                <i data-lucide="log-out" class="w-3.5 h-3.5"></i>
                Logout
            </a>
        </div>
    </div>
</aside>

<!-- MAIN CONTENT -->
<div class="flex-1 flex flex-col h-screen overflow-y-auto">

<header class="bg-white border-b border-slate-200/80 px-7 py-3.5 flex justify-between items-center sticky top-0 z-20 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
    <div class="flex items-center gap-4">
        <button type="button" id="mobileMenuButton" aria-label="Toggle navigation menu" aria-expanded="false" class="lg:hidden text-slate-600 hover:text-slate-900 focus:outline-none">
            <i data-lucide="menu" class="w-5 h-5"></i>
        </button>
        <h2 class="font-bold text-slate-800 text-base md:text-[17px]">
            Campus Lost & Found Management System
        </h2>
    </div>

    <div class="flex items-center gap-6">
        <a href="notifications.php" id="notificationButton" class="relative cursor-pointer p-1.5 hover:bg-slate-100 rounded-full transition block">
            <i data-lucide="bell" class="w-5 h-5 text-slate-700"></i>
            ${unread_count > 0 ? `
            <span class="absolute top-0 right-0 bg-[#22c55e] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold ring-2 ring-white">
                ${unread_count}
            </span>` : ''}
        </a>

        <div class="flex items-center gap-2.5 cursor-pointer group">
            <div class="w-9 h-9 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center shadow-sm">
                <i data-lucide="user" class="w-5 h-5 text-teal-700"></i>
            </div>
            <p class="text-xs font-bold text-slate-800 leading-snug group-hover:text-teal-700 transition">
                ${escapeHtml(full_name)}
            </p>
        </div>
    </div>
</header>

<main class="p-6 md:p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">

<!-- WELCOME BANNER -->
<div class="relative overflow-hidden bg-gradient-to-r from-[#eafaf1] via-[#ebfaef] to-[#d8f3dc] border border-emerald-200/80 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between shadow-[0_2px_10px_rgba(16,185,129,0.06)]">
    <div class="relative z-10 space-y-1 max-w-md">
        <h1 class="text-2xl sm:text-[25px] font-extrabold text-slate-900 tracking-tight">
            Welcome back, ${escapeHtml(full_name)}! 👋
        </h1>
        <p class="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
            Let's help each other by reuniting lost items with their owners.
        </p>
    </div>

    <div class="flex items-center justify-center relative z-10 shrink-0 mt-4 md:mt-0">
        <img src="images/banner.jpeg" alt="Lost & Found Items" class="h-28 md:h-32 w-auto object-contain rounded-2xl drop-shadow-md">
    </div>
</div>

<!-- QUICK ACTION CARDS -->
<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
    <a href="add-lost-item.php" class="bg-[#eff6ff] hover:bg-[#e0f0fe] border border-[#bfdbfe]/80 hover:border-blue-300 p-4 rounded-2xl text-center transition duration-200 shadow-sm hover:shadow-md flex flex-col items-center group">
        <div class="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-2 group-hover:scale-110 transition duration-200 relative">
            <svg class="w-7 h-7 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                <path d="M3 6h18"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            <span class="absolute -bottom-1 -right-1 bg-blue-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold ring-2 ring-white">?</span>
        </div>
        <h3 class="font-bold text-xs text-slate-800">Add Lost Item</h3>
        <p class="text-[10.5px] text-slate-500 font-medium mt-0.5">Report your lost item</p>
    </a>

    <a href="add-found-item.php" class="bg-[#ecfdf5] hover:bg-[#d1fae5] border border-[#a7f3d0]/80 hover:border-emerald-300 p-4 rounded-2xl text-center transition duration-200 shadow-sm hover:shadow-md flex flex-col items-center group">
        <div class="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-2 group-hover:scale-110 transition duration-200 relative">
            <svg class="w-7 h-7 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                <path d="M3 6h18"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            <span class="absolute -bottom-1 -right-1 bg-emerald-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold ring-2 ring-white">✓</span>
        </div>
        <h3 class="font-bold text-xs text-slate-800">Add Found Item</h3>
        <p class="text-[10.5px] text-slate-500 font-medium mt-0.5">Report found item</p>
    </a>

    <a href="search-item.html" class="bg-[#fffbeb] hover:bg-[#fef3c7] border border-[#fde68a]/80 hover:border-amber-300 p-4 rounded-2xl text-center transition duration-200 shadow-sm hover:shadow-md flex flex-col items-center group">
        <div class="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-2 group-hover:scale-110 transition duration-200">
            <svg class="w-7 h-7 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.3-4.3"/>
            </svg>
        </div>
        <h3 class="font-bold text-xs text-slate-800">Search Item</h3>
        <p class="text-[10.5px] text-slate-500 font-medium mt-0.5">Search lost & found items</p>
    </a>

    <a href="view-items.php" class="bg-[#f5f3ff] hover:bg-[#ede9fe] border border-[#ddd6fe]/80 hover:border-purple-300 p-4 rounded-2xl text-center transition duration-200 shadow-sm hover:shadow-md flex flex-col items-center group">
        <div class="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-2 group-hover:scale-110 transition duration-200">
            <svg class="w-7 h-7 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                <rect x="8" y="2" width="8" height="4" rx="1"/>
            </svg>
        </div>
        <h3 class="font-bold text-xs text-slate-800">View All Items</h3>
        <p class="text-[10.5px] text-slate-500 font-medium mt-0.5">View all lost & found items</p>
    </a>

    <a href="my-matches.php" class="bg-[#fff1f2] hover:bg-[#ffe4e6] border border-[#fecdd3]/80 hover:border-rose-300 p-4 rounded-2xl text-center transition duration-200 shadow-sm hover:shadow-md flex flex-col items-center group col-span-2 sm:col-span-1">
        <div class="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center mb-2 group-hover:scale-110 transition duration-200">
            <svg class="w-7 h-7 text-rose-500 fill-rose-500" viewBox="0 0 24 24">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3 c-1.76 0-3 .5-4.5 2 -1.5-1.5-2.74-2-4.5-2 A5.5 5.5 0 0 0 2 8.5 c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
            </svg>
        </div>
        <h3 class="font-bold text-xs text-slate-800">My Matches</h3>
        <p class="text-[10.5px] text-slate-500 font-medium mt-0.5">Items that might match</p>
    </a>
</div>

<!-- RECENT POSTS -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-6">

    <!-- RECENT LOST -->
    <div class="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition">
        <div>
            <div class="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                <div class="flex items-center gap-2 text-slate-800 font-bold text-sm">
                    <svg class="w-5 h-5 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                        <path d="M3 6h18"/>
                        <path d="M16 10a4 4 0 0 1-8 0"/>
                    </svg>
                    <span>Recent Lost Posts</span>
                </div>
                <a href="view-items.php?type=lost" class="text-xs font-bold text-rose-600 hover:underline">View All</a>
            </div>

            <div class="space-y-3.5">
                ${lostRowsHtml}
            </div>
        </div>

        <div class="mt-5 pt-3 border-t border-slate-100 text-center">
            <a href="view-items.php?type=lost" class="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 transition">
                View All Lost Posts
                <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
            </a>
        </div>
    </div>

    <!-- RECENT ALL POSTS -->
    <div class="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition">
        <div>
            <div class="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                <div class="flex items-center gap-2 text-slate-800 font-bold text-sm">
                    <svg class="w-5 h-5 text-teal-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                        <rect x="8" y="2" width="8" height="4" rx="1"/>
                    </svg>
                    <span>Recent Posts</span>
                </div>
                <a href="view-items.php" class="text-xs font-bold text-teal-600 hover:underline">View All</a>
            </div>

            <div class="space-y-3.5">
                ${recentRowsHtml}
            </div>
        </div>

        <div class="mt-5 pt-3 border-t border-slate-100 text-center">
            <a href="view-items.php" class="inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 hover:text-teal-700 transition">
                View All Posts
                <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
            </a>
        </div>
    </div>

    <!-- RECENT FOUND -->
    <div class="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition">
        <div>
            <div class="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                <div class="flex items-center gap-2 text-slate-800 font-bold text-sm">
                    <svg class="w-5 h-5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                        <path d="M3 6h18"/>
                        <path d="M16 10a4 4 0 0 1-8 0"/>
                    </svg>
                    <span>Recent Found Posts</span>
                </div>
                <a href="view-items.php?type=found" class="text-xs font-bold text-emerald-600 hover:underline">View All</a>
            </div>

            <div class="space-y-3.5">
                ${foundRowsHtml}
            </div>
        </div>

        <div class="mt-5 pt-3 border-t border-slate-100 text-center">
            <a href="view-items.php?type=found" class="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition">
                View All Found Posts
                <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
            </a>
        </div>
    </div>

</div>

<footer class="text-center text-xs text-slate-400 py-6 font-medium">
    © 2026 Campus Lost & Found Management System. All rights reserved.
</footer>

</main>
</div>

<script>
    if (window.lucide && typeof lucide.createIcons === 'function') {
        lucide.createIcons();
    }

    const mobileMenuButton = document.getElementById('mobileMenuButton');
    const mobileSidebar = document.getElementById('mobileSidebar');

    if (mobileMenuButton && mobileSidebar) {
        mobileMenuButton.addEventListener('click', function () {
            if (window.innerWidth < 1024) {
                mobileSidebar.classList.toggle('hidden');
                mobileMenuButton.setAttribute('aria-expanded', !mobileSidebar.classList.contains('hidden'));
            }
        });

        const sidebarLinks = mobileSidebar.querySelectorAll('a');
        sidebarLinks.forEach(function (link) {
            link.addEventListener('click', function () {
                if (window.innerWidth < 1024) {
                    mobileSidebar.classList.add('hidden');
                    mobileMenuButton.setAttribute('aria-expanded', 'false');
                }
            });
        });

        window.addEventListener('resize', function () {
            if (window.innerWidth >= 1024) {
                mobileSidebar.classList.remove('hidden');
                mobileMenuButton.setAttribute('aria-expanded', 'false');
            } else {
                mobileSidebar.classList.add('hidden');
                mobileMenuButton.setAttribute('aria-expanded', 'false');
            }
        });
    }
</script>
</body>
</html>`;
}

module.exports = { renderDashboard };

