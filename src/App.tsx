import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Wallet, 
  TrendingUp, 
  History, 
  Settings as SettingsIcon, 
  Power, 
  Eye, 
  EyeOff, 
  Check, 
  Calendar, 
  Trash2, 
  Edit3, 
  Copy, 
  ArrowDownLeft, 
  ArrowUpRight, 
  RefreshCw, 
  ChevronRight, 
  FolderPlus, 
  Layers, 
  UserPlus, 
  Download, 
  FileText, 
  Image as ImageIcon, 
  TrendingDown, 
  Cpu, 
  ChevronLeft,
  X,
  CreditCard,
  Lock,
  Unlock
} from 'lucide-react';
import { LocalDB, formatMYR, formatCustomDate } from './utils';
import { Asset, Category, Pilar, Budget, Transaction, User } from './types';
// @ts-ignore
import loginLogo from './assets/images/favicon.png';

export default function App() {
  // State from Local DB
  const [users, setUsers] = useState<User[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [pilars, setPilars] = useState<Pilar[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  
  // UI States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('@RuangPerpus');
  const [loginError, setLoginError] = useState('');
  
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [activePage, setActivePage] = useState<'home' | 'assets' | 'report' | 'history' | 'settings'>('home');
  const [liveClock, setLiveClock] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Filter States for Riwayat (History)
  const [histTypeFilter, setHistTypeFilter] = useState<'Semua' | 'Pemasukan' | 'Pengeluaran'>('Semua');
  const [histStartDate, setHistStartDate] = useState('');
  const [histEndDate, setHistEndDate] = useState('');
  const [histAssetFilter, setHistAssetFilter] = useState('Semua');

  // Filter States for Analitik (Report)
  const [repYearFilter, setRepYearFilter] = useState(new Date().getFullYear().toString());
  const [repMonthFilter, setRepMonthFilter] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [repAssetFilter, setRepAssetFilter] = useState('Semua');
  const [repPilarFilter, setRepPilarFilter] = useState<string | null>(null);
  const [repCategoryFilter, setRepCategoryFilter] = useState<string | null>(null);

  // Quick Add Transaction Dialog state
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [txDate, setTxDate] = useState(new Date().toISOString().substring(0, 10));
  const [txType, setTxType] = useState<'Pemasukan' | 'Pengeluaran' | 'Transfer'>('Pengeluaran');
  const [txAmountStr, setTxAmountStr] = useState('');
  const [txAsset, setTxAsset] = useState('');
  const [txCategory, setTxCategory] = useState(''); // Category or Destination Wallet if transfer
  const [txNote, setTxNote] = useState('');
  const [txReceiptBase64, setTxReceiptBase64] = useState<string | null>(null);

  // Settings action modes
  const [settingsModal, setSettingsModal] = useState<{
    type: 'add_user' | 'edit_user' | 'add_category' | 'edit_category' | 'add_pilar' | 'edit_pilar' | 'add_asset' | 'edit_asset' | 'add_budget' | 'edit_budget' | null;
    data?: any;
  } | null>(null);

  // Custom confirmation dialog to support iframe environment (replaces blocked window.confirm)
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Form Inputs for settings modals
  const [userInputFullname, setUserInputFullname] = useState('');
  const [userInputUsername, setUserInputUsername] = useState('');
  const [userInputEmail, setUserInputEmail] = useState('');
  const [userInputPassword, setUserInputPassword] = useState('');
  const [userInputRole, setUserInputRole] = useState<'Admin' | 'User'>('User');

  const [catInputName, setCatInputName] = useState('');
  const [catInputPilar, setCatInputPilar] = useState('');

  const [pilarInputName, setPilarInputName] = useState('');

  const [assetInputName, setAssetInputName] = useState('');
  const [assetInputNoRek, setAssetInputNoRek] = useState('');
  const [assetInputVal, setAssetInputVal] = useState('');
  const [assetInputOwner, setAssetInputOwner] = useState('');
  const [adminFilterUser, setAdminFilterUser] = useState<string>('Semua');

  const [budgetInputCat, setBudgetInputCat] = useState('');
  const [budgetInputLimit, setBudgetInputLimit] = useState('');
  const [budgetInputStart, setBudgetInputStart] = useState('');
  const [budgetInputEnd, setBudgetInputEnd] = useState('');
  const [budgetInputIgnoreDate, setBudgetInputIgnoreDate] = useState(false);
  const [budgetInputNote, setBudgetInputNote] = useState('');

  // Toast State for micro feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Run initial state loading
  useEffect(() => {
    LocalDB.init();
    setUsers(LocalDB.getUsers());
    setAssets(LocalDB.getAssets());
    setPilars(LocalDB.getPilars());
    setCategories(LocalDB.getCategories());
    setTransactions(LocalDB.getTransactions());
    setBudgets(LocalDB.getBudgets());
    setIsBalanceHidden(LocalDB.getHideBalance());
    
    const savedDark = LocalDB.getThemeDark();
    setIsDarkMode(savedDark);
    if (savedDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }

    // Auto-login if previously saved, otherwise prompt
    const savedUser = sessionStorage.getItem('logged_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  // Sync Live Clock in ms-MY / en-MY style
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const days = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
      const months = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];
      const dayName = days[now.getDay()];
      const day = now.getDate();
      const month = months[now.getMonth()];
      const year = now.getFullYear();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      setLiveClock(`${h}:${m}, ${dayName} ${day} ${month} ${year}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Quick show notification toast helper
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Handle system logging out
  const handleLogout = () => {
    sessionStorage.removeItem('logged_user');
    setCurrentUser(null);
    triggerToast('Anda telah log keluar.');
  };

  // Handle authentication login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const found = users.find(u => u.username.toLowerCase() === loginUsername.toLowerCase());
    
    // Simple custom password check just like original GAS script (mock authentication bypass)
    if (found && (loginPassword === '@RuangPerpus' || loginPassword === found.username)) {
      setLoginError('');
      setCurrentUser(found);
      sessionStorage.setItem('logged_user', JSON.stringify(found));
      triggerToast(`Selamat kembali, ${found.fullname}!`);
    } else {
      setLoginError('Kredonari login tidak sah (Username/Kata Laluan salah).');
    }
  };

  // Force database sync mock feedback
  const triggerMockSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      triggerToast('Pangkalan data Ringgit Malaysia telah diselaraskan.');
    }, 1200);
  };

  // Filtered assets based on logged in user or admin selector
  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      if (currentUser?.role === 'Admin') {
        if (adminFilterUser && adminFilterUser !== 'Semua') {
          return a.owner === adminFilterUser;
        }
        return true;
      }
      return a.owner === currentUser?.username;
    });
  }, [assets, currentUser, adminFilterUser]);

  // Handle all transaction items isolation based on logged in user's wallets
  const displayTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Find asset of this transaction to match who owns it
      const assetObj = assets.find(a => a.name === t.assetName);
      if (currentUser?.role === 'Admin') {
        if (adminFilterUser && adminFilterUser !== 'Semua') {
          return assetObj?.owner === adminFilterUser;
        }
        return true;
      }
      return assetObj?.owner === currentUser?.username;
    });
  }, [transactions, assets, currentUser, adminFilterUser]);

  // Reactive lock status for active user (if Super Admin locks them, all actions immediately lock)
  const isCurrentlyLocked = useMemo(() => {
    if (!currentUser) return false;
    if (currentUser.role === 'Admin') return false; // Admins are never locked
    const found = users.find(u => u.username === currentUser.username);
    return found ? !!found.isLocked : !!currentUser.isLocked;
  }, [users, currentUser]);

  // Calculate Net Worth / Total asset in wallet
  const netWealth = useMemo(() => {
    return filteredAssets
      .filter(a => a.category === 'Dompet')
      .reduce((sum, a) => sum + a.value, 0);
  }, [filteredAssets]);

  // Current Month Totals
  const totalsThisMonth = useMemo(() => {
    const currentYearMonth = new Date().toISOString().substring(0, 7); // "YYYY-MM"
    let income = 0;
    let expense = 0;

    displayTransactions.forEach(t => {
      if (t.date.substring(0, 7) === currentYearMonth) {
        if (t.type === 'Pemasukan') {
          income += t.amount;
        } else if (t.type === 'Pengeluaran') {
          expense += t.amount;
        }
      }
    });

    return { income, expense };
  }, [displayTransactions]);

  // Toggle hiding wealth balance
  const toggleBalancePrivacy = () => {
    const nextVal = !isBalanceHidden;
    setIsBalanceHidden(nextVal);
    LocalDB.saveHideBalance(nextVal);
    triggerToast(nextVal ? 'Baki disembunyikan.' : 'Baki dipaparkan.');
  };

  // Toggle Theme Mode
  const toggleDarkMode = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    LocalDB.saveThemeDark(nextDark);
    if (nextDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    triggerToast(nextDark ? 'Mod Gelap diaktifkan' : 'Mod Terang diaktifkan');
  };

  // Filtered transactions for Riwayat
  const filteredHistory = useMemo(() => {
    return displayTransactions.filter(t => {
      // Type Filter
      if (histTypeFilter !== 'Semua') {
        if (histTypeFilter === 'Pemasukan' && t.type !== 'Pemasukan') return false;
        if (histTypeFilter === 'Pengeluaran' && t.type !== 'Pengeluaran') return false;
      }
      // Asset Wallet Filter
      if (histAssetFilter !== 'Semua' && t.assetName !== histAssetFilter) return false;
      // Date constraints
      const txDayOnly = t.date.substring(0, 10);
      if (histStartDate && txDayOnly < histStartDate) return false;
      if (histEndDate && txDayOnly > histEndDate) return false;
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [displayTransactions, histTypeFilter, histAssetFilter, histStartDate, histEndDate]);

  // Filtered transactions for Report
  const filteredReportTx = useMemo(() => {
    return displayTransactions.filter(t => {
      // Period Month/Year match
      let matchPeriod = false;
      if (repMonthFilter === 'Semua') {
        matchPeriod = t.date.substring(0, 4) === repYearFilter;
      } else {
        matchPeriod = t.date.substring(0, 7) === `${repYearFilter}-${repMonthFilter}`;
      }
      if (!matchPeriod) return false;

      // Wallet match
      if (repAssetFilter !== 'Semua' && t.assetName !== repAssetFilter) return false;

      // Skip internal transfers for pure expense reporting
      if (t.category === 'Transfer Masuk' || t.category === 'Transfer Keluar') return false;

      return true;
    });
  }, [displayTransactions, repYearFilter, repMonthFilter, repAssetFilter]);

  // Report statistics calculations
  const reportStats = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    let incomeCount = 0;
    let expenseCount = 0;
    const categoryExpenseMap: { [key: string]: number } = {};
    const pilarExpenseMap: { [key: string]: number } = {};
    const userExpenseMap: { [username: string]: number } = {};

    filteredReportTx.forEach(t => {
      if (t.type === 'Pemasukan') {
        totalIncome += t.amount;
        incomeCount++;
      } else if (t.type === 'Pengeluaran') {
        totalExpense += t.amount;
        expenseCount++;
        
        // Category expense aggregation
        categoryExpenseMap[t.category] = (categoryExpenseMap[t.category] || 0) + t.amount;

        // Pilar analysis
        const categoryDef = categories.find(c => c.name.toLowerCase() === t.category.toLowerCase() && c.type === 'Pengeluaran');
        const pilarName = categoryDef?.pilar || 'Lain-lain';
        pilarExpenseMap[pilarName] = (pilarExpenseMap[pilarName] || 0) + t.amount;

        // User logs
        const loggedUser = t.user || 'Sistem';
        userExpenseMap[loggedUser] = (userExpenseMap[loggedUser] || 0) + t.amount;
      }
    });

    return {
      totalIncome,
      totalExpense,
      incomeCount,
      expenseCount,
      categoryExpenseMap,
      pilarExpenseMap,
      userExpenseMap
    };
  }, [filteredReportTx, categories]);

  // Sorted Expense Categories for doughnut display & lists
  const sortedReportCategories = useMemo(() => {
    return Object.entries(reportStats.categoryExpenseMap as Record<string, number>)
      .map(([name, val]) => ({ name, value: val as number }))
      .sort((a, b) => b.value - a.value);
  }, [reportStats]);

  // Spending Advice AI generator engine based on current month stats
  const smartAdvice = useMemo(() => {
    if (sortedReportCategories.length === 0) {
      return {
        title: 'Pembantu Kewangan Pintar',
        text: 'Belum ada data pengeluaran direkodkan bagi tempoh ini. Catat perbelanjaan anda menggunakan butang tambah di bawah untuk mendapatkan analisis pintar!',
        isWarning: false
      };
    }

    const topCategory = sortedReportCategories[0];
    const percentage = reportStats.totalExpense > 0 ? Math.round((topCategory.value / reportStats.totalExpense) * 100) : 0;
    const keyCatName = topCategory.name.toLowerCase();

    let tip = 'Nilai pengeluaran anda dikesan stabil. Utamakan membina tabung kecemasan sekurang-kurangnya 3 hingga 6 bulan belanja bulanan.';
    if (keyCatName.includes('makan') || keyCatName.includes('minum') || keyCatName.includes('food')) {
      tip = 'Kurangkan makan di luar atau beralih kepada memesan barangan mentah dapur untuk dimasak sendiri. Ini dapat merendahkan belanja sebanyak 40%.';
    } else if (keyCatName.includes('petrol') || keyCatName.includes('transport') || keyCatName.includes('kereta')) {
      tip = 'Pertimbangkan berkongsi kenderaan atau mengoptimumkan perjalanan harian anda bagi mengurangkan penggunaan bahan api dan tol bas.';
    } else if (keyCatName.includes('beli') || keyCatName.includes('shopp') || keyCatName.includes('baju')) {
      tip = 'Lakukan prinsip "Tunggu 48 Jam" sebelum checkout barangan di tetingkap e-dagang Shopee/Lazada anda demi menyaring emosi meluap-luap.';
    } else if (keyCatName.includes('hiburan') || keyCatName.includes('wayang') || keyCatName.includes('netflix')) {
      tip = 'Beralih kepada pilihan rekreasi luar percuma dan tapis perkhidmatan langganan atas talian yang jarang digunakan.';
    } else if (keyCatName.includes('bil') || keyCatName.includes('sewa') || keyCatName.includes('utiliti')) {
      tip = 'Fokus menutup plug elektrik ketika tidak digunakan dan bandingkan tarif pakej internet/telefon untuk mendapat pelan penjimatan.';
    }

    return {
      title: 'Tumpuan Perbelanjaan Utama',
      text: `Belanja tertinggi adalah bagi kategori "${topCategory.name}" yang menyumbang sebanyak ${percentage}% (${formatMYR(topCategory.value)}) daripada jumlah pembayaran tempoh ini.`,
      tip,
      isWarning: percentage > 45
    };
  }, [sortedReportCategories, reportStats]);

  // Open Quick Add Modal
  const openAddTransaction = () => {
    const defaultAsset = assets[0]?.name || '';
    setTxAsset(defaultAsset);
    setTxType('Pengeluaran');
    setTxAmountStr('');
    setTxNote('');
    setTxReceiptBase64(null);

    // Initial default category
    const list = categories.filter(c => c.type === 'Pengeluaran');
    setTxCategory(list[0]?.name || 'Lain-lain');
    setIsAddTxOpen(true);
  };

  // Handle Type Change inside transaction form
  const handleTxTypeChange = (type: 'Pemasukan' | 'Pengeluaran' | 'Transfer') => {
    setTxType(type);
    if (type === 'Transfer') {
      const pocketList = assets.filter(a => a.category === 'Dompet');
      // Set Source (txAsset) & Destination (txCategory)
      setTxAsset(pocketList[0]?.name || '');
      setTxCategory(pocketList[1]?.name || pocketList[0]?.name || '');
    } else {
      const list = categories.filter(c => c.type === type);
      setTxAsset(assets[0]?.name || '');
      setTxCategory(list[0]?.name || 'Lain-lain');
    }
  };

  // Format inline input for money
  const handleAmountInMYR = (val: string) => {
    // Keep digits only
    const digits = val.replace(/[^0-9]/g, '');
    if (!digits) {
      setTxAmountStr('');
      return;
    }
    // format thousands separating with comma
    const rawVal = parseInt(digits, 10);
    const formatted = new Intl.NumberFormat('en-MY').format(rawVal);
    setTxAmountStr(formatted);
  };

  const handleAssetAmountInMYR = (val: string) => {
    const digits = val.replace(/[^0-9]/g, '');
    if (!digits) {
      setAssetInputVal('');
      return;
    }
    const rawVal = parseInt(digits, 10);
    const formatted = new Intl.NumberFormat('en-MY').format(rawVal);
    setAssetInputVal(formatted);
  };

  const handleBudgetLimitInMYR = (val: string) => {
    const digits = val.replace(/[^0-9]/g, '');
    if (!digits) {
      setBudgetInputLimit('');
      return;
    }
    const rawVal = parseInt(digits, 10);
    const formatted = new Intl.NumberFormat('en-MY').format(rawVal);
    setBudgetInputLimit(formatted);
  };

  // Save transaction actual execution
  const executeTransactionSaving = (parsedAmount: number) => {
    if (!currentUser) return;
    // New transaction instantiation
    const newTx: Transaction = {
      id: 'tx-' + Date.now(),
      date: txDate + 'T' + new Date().toTimeString().substring(0, 8),
      type: txType,
      assetName: txAsset,
      amount: parsedAmount,
      note: txNote,
      category: txCategory,
      user: currentUser.fullname,
      receiptUrl: txReceiptBase64 || undefined
    };

    // Balance Updates
    const updatedAssets = assets.map(a => {
      const fresh = { ...a };
      if (txType === 'Pemasukan') {
        if (fresh.name === txAsset) fresh.value += parsedAmount;
      } else if (txType === 'Pengeluaran') {
        if (fresh.name === txAsset) fresh.value -= parsedAmount;
      } else if (txType === 'Transfer') {
        if (fresh.name === txAsset) fresh.value -= parsedAmount; // Deduct from source
        if (fresh.name === txCategory) fresh.value += parsedAmount; // Add to destination
      }
      return fresh;
    });

    const updatedTransactions = [newTx, ...transactions];
    
    // Save state
    setAssets(updatedAssets);
    LocalDB.saveAssets(updatedAssets);

    setTransactions(updatedTransactions);
    LocalDB.saveTransactions(updatedTransactions);

    setIsAddTxOpen(false);
    triggerToast('Transaksi berjaya direkodkan!');
  };

  // Save transaction submitted from modal
  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (isCurrentlyLocked) {
      triggerToast('Akaun anda telah dikunci oleh Admin. Anda tidak dibenarkan untuk merekodkan sebarang transaksi.');
      return;
    }

    const parsedAmount = parseFloat(txAmountStr.replace(/,/g, ''));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      triggerToast('Sila masukkan nilai RM yang sah.');
      return;
    }

    if (txType === 'Transfer' && txAsset === txCategory) {
      triggerToast('Pemindahan tidak boleh dilakukan ke dompet yang sama!');
      return;
    }

    // Wallet checks for overdraft warning
    if (txType === 'Pengeluaran' || txType === 'Transfer') {
      const parentPocket = assets.find(a => a.name === txAsset);
      if (parentPocket && parentPocket.value < parsedAmount) {
        setConfirmModal({
          title: 'Amaran Baki Kurang',
          message: `Perhatian: Baki dompet "${txAsset}" (${formatMYR(parentPocket.value)}) tidak mencukupi untuk bayaran RM ${txAmountStr}. Teruskan mencatat?`,
          onConfirm: () => {
            executeTransactionSaving(parsedAmount);
            setConfirmModal(null);
          }
        });
        return;
      }
    }

    executeTransactionSaving(parsedAmount);
  };

  // Delete transaction security confirm
  const handleDeleteTx = (id: string) => {
    if (isCurrentlyLocked) {
      triggerToast('Akaun anda telah dikunci oleh Admin. Anda tidak dibenarkan untuk memadam transaksi.');
      return;
    }
    const target = transactions.find(t => t.id === id);
    if (!target) return;

    setConfirmModal({
      title: 'Padam Transaksi',
      message: `Adakah anda mahu memadam rekod "${target.category}" bernilai ${formatMYR(target.amount)}? Baki dompet akan diselaraskan semula.`,
      onConfirm: () => {
        // Restore balances
        const updatedAssets = assets.map(a => {
          const fresh = { ...a };
          if (target.type === 'Pemasukan') {
            if (fresh.name === target.assetName) fresh.value -= target.amount;
          } else if (target.type === 'Pengeluaran') {
            if (fresh.name === target.assetName) fresh.value += target.amount;
          } else if (target.type === 'Transfer') {
            if (fresh.name === target.assetName) fresh.value += target.amount;
            if (fresh.name === target.category) fresh.value -= target.amount;
          }
          return fresh;
        });

        const updatedTransactions = transactions.filter(t => t.id !== id);

        setAssets(updatedAssets);
        LocalDB.saveAssets(updatedAssets);

        setTransactions(updatedTransactions);
        LocalDB.saveTransactions(updatedTransactions);

        triggerToast('Rekod transaksi telah dipadam.');
        setConfirmModal(null);
      }
    });
  };

  // Handle Receipt Upload Image conversion to Base64 (consistent with dynamic preview rules)
  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        triggerToast('Fail melebihi had 2 MB!');
        return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => {
        setTxReceiptBase64(evt.target?.result as string);
        triggerToast('Gambar resit dimuat naik!');
      };
      reader.readAsDataURL(file);
    }
  };

  // Settings modals helpers
  const closeSettingsModal = () => {
    setSettingsModal(null);
    setUserInputFullname('');
    setUserInputUsername('');
    setUserInputEmail('');
    setUserInputPassword('');
    setCatInputName('');
    setCatInputPilar('');
    setPilarInputName('');
    setAssetInputName('');
    setAssetInputNoRek('');
    setAssetInputVal('');
    setBudgetInputCat('');
    setBudgetInputLimit('');
    setBudgetInputStart('');
    setBudgetInputEnd('');
    setBudgetInputIgnoreDate(false);
    setBudgetInputNote('');
  };

  // Save custom parameters (user, category, wallet, budgeting)
  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsModal) return;

    if (isCurrentlyLocked) {
      triggerToast('Akaun anda telah dikunci oleh Admin. Anda tidak dibenarkan untuk menukar, menambah atau mengemaskini tetapan.');
      return;
    }

    const mType = settingsModal.type;

    if (mType === 'add_user') {
      if (!userInputUsername || !userInputFullname) return;
      const newUser: User = {
        username: userInputUsername.toLowerCase().trim(),
        fullname: userInputFullname.trim(),
        role: userInputRole,
        email: userInputEmail.trim()
      };
      const updated = [...users, newUser];
      setUsers(updated);
      LocalDB.saveUsers(updated);
      triggerToast('Pengguna baru berjaya didaftarkan.');
    } 
    
    else if (mType === 'edit_user') {
      const targetUser = settingsModal.data as User;
      const updated = users.map(u => {
        if (u.username === targetUser.username) {
          return { ...u, fullname: userInputFullname, role: userInputRole, email: userInputEmail };
        }
        return u;
      });
      setUsers(updated);
      LocalDB.saveUsers(updated);
      triggerToast('Akaun pengguna telah dikemaskini.');
    }

    else if (mType === 'add_category') {
      const type = settingsModal.data as 'Pemasukan' | 'Pengeluaran';
      if (!catInputName) return;
      const newCat: Category = {
        name: catInputName.trim(),
        type,
        pilar: catInputPilar || undefined
      };
      const updated = [...categories, newCat];
      setCategories(updated);
      LocalDB.saveCategories(updated);
      triggerToast(`Kategori ${type} berjaya ditambah.`);
    }

    else if (mType === 'edit_category') {
      const oldCat = settingsModal.data as Category;
      if (!catInputName) return;
      const updated = categories.map(c => {
        if (c.name === oldCat.name && c.type === oldCat.type) {
          return { ...c, name: catInputName, pilar: catInputPilar || undefined };
        }
        return c;
      });
      setCategories(updated);
      LocalDB.saveCategories(updated);
      triggerToast('Kategori dikemaskini.');
    }

    else if (mType === 'add_pilar') {
      const type = settingsModal.data as 'Pemasukan' | 'Pengeluaran';
      if (!pilarInputName) return;
      const newPilar: Pilar = {
        name: pilarInputName.trim(),
        type
      };
      const updated = [...pilars, newPilar];
      setPilars(updated);
      LocalDB.savePilars(updated);
      triggerToast('Pilar berjaya didaftarkan.');
    }

    else if (mType === 'add_asset') {
      if (!assetInputName) return;
      const rawBal = parseFloat(assetInputVal.replace(/,/g, '')) || 0;
      const newAsset: Asset = {
        name: assetInputName.trim(),
        no_rek: assetInputNoRek.trim() || '-',
        value: rawBal,
        category: 'Dompet',
        owner: currentUser?.role === 'Admin' ? (assetInputOwner || 'admin') : (currentUser?.username || 'admin')
      };
      const updated = [...assets, newAsset];
      setAssets(updated);
      LocalDB.saveAssets(updated);
      triggerToast('Dompet kewangan berjaya dibina.');
    }

    else if (mType === 'edit_asset') {
      const oldAsset = settingsModal.data as Asset;
      if (!assetInputName) return;
      const rawBal = parseFloat(assetInputVal.replace(/,/g, '')) || 0;
      const updated = assets.map(a => {
        if (a.name === oldAsset.name) {
          return { 
            ...a, 
            name: assetInputName.trim(), 
            no_rek: assetInputNoRek.trim() || '-', 
            value: rawBal,
            owner: currentUser?.role === 'Admin' ? (assetInputOwner || a.owner || 'admin') : (a.owner || 'admin')
          };
        }
        return a;
      });
      setAssets(updated);
      LocalDB.saveAssets(updated);
      triggerToast('Maklumat bank/dompet dikemaskini.');
    }

    else if (mType === 'add_budget' || mType === 'edit_budget') {
      const type = settingsModal.data.type as 'Pemasukan' | 'Pengeluaran';
      const monthlyKey = new Date().toISOString().substring(0, 7);
      const limitVal = parseFloat(budgetInputLimit.replace(/,/g, '')) || 0;
      if (!budgetInputCat || limitVal <= 0) {
        triggerToast('Sila isikan sasaran kateogri dan nilai bajet!');
        return;
      }

      let dRange = '';
      if (budgetInputStart && budgetInputEnd) {
        dRange = `${budgetInputStart}_${budgetInputEnd}`;
      }

      let noteText = budgetInputNote;
      if (budgetInputIgnoreDate) {
        noteText = '[ALL] ' + noteText;
      }

      let updated: Budget[];
      if (mType === 'add_budget') {
        const newBudget: Budget = {
          month: monthlyKey,
          type,
          category: budgetInputCat,
          limit: limitVal,
          dateRange: dRange,
          note: noteText
        };
        updated = [...budgets, newBudget];
      } else {
        const oldB = settingsModal.data.budget as Budget;
        updated = budgets.map(b => {
          if (b.month === oldB.month && b.category === oldB.category && b.type === oldB.type) {
            return {
              ...b,
              category: budgetInputCat,
              limit: limitVal,
              dateRange: dRange,
              note: noteText
            };
          }
          return b;
        });
      }

      setBudgets(updated);
      LocalDB.saveBudgets(updated);
      triggerToast('Target belanjawan bulanan dikemaskini.');
    }

    closeSettingsModal();
  };

  // Delete handlers inside settings
  const handleDeleteUser = (username: string) => {
    if (username === 'admin') {
      triggerToast('Tidak boleh memadam akaun pemilik utama (Super Admin).');
      return;
    }
    if (currentUser?.username === username) {
      triggerToast('Anda tidak boleh memadam akaun anda yang sedang log masuk!');
      return;
    }
    setConfirmModal({
      title: 'Singkir Pengguna',
      message: `Singkirkan akaun pengguna "@${username}"?`,
      onConfirm: () => {
        const updated = users.filter(u => u.username !== username);
        setUsers(updated);
        LocalDB.saveUsers(updated);
        triggerToast('Pengguna ditolak akses.');
        setConfirmModal(null);
      }
    });
  };

  const toggleUserLock = (username: string) => {
    if (username === 'admin') {
      triggerToast('Super Admin tidak boleh dikunci.');
      return;
    }
    const updated = users.map(u => {
      if (u.username === username) {
        const nextState = !u.isLocked;
        triggerToast(`Akaun @${username} telah ${nextState ? 'dikunci' : 'dibuka kunci'}`);
        return { ...u, isLocked: nextState };
      }
      return u;
    });
    setUsers(updated);
    LocalDB.saveUsers(updated);
  };

  const handleDeleteCategory = (cat: Category) => {
    setConfirmModal({
      title: 'Padam Kategori',
      message: `Padam kategori "${cat.name}" (${cat.type})?`,
      onConfirm: () => {
        const updated = categories.filter(c => !(c.name === cat.name && c.type === cat.type));
        setCategories(updated);
        LocalDB.saveCategories(updated);
        triggerToast('Kategori disingkirkan.');
        setConfirmModal(null);
      }
    });
  };

  const handleDeletePilar = (p: Pilar) => {
    setConfirmModal({
      title: 'Padam Pilar',
      message: `Padam pilar "${p.name}"? Rutin kategori di bawahnya akan diletakkan di bawah seksyen biasa.`,
      onConfirm: () => {
        const updatedPilars = pilars.filter(item => !(item.name === p.name && item.type === p.type));
        setPilars(updatedPilars);
        LocalDB.savePilars(updatedPilars);
        
        const updatedCategories = categories.map(c => {
          if (c.pilar === p.name && c.type === p.type) {
            return { ...c, pilar: undefined };
          }
          return c;
        });
        setCategories(updatedCategories);
        LocalDB.saveCategories(updatedCategories);

        triggerToast('Pilar ditolak dari senarai.');
        setConfirmModal(null);
      }
    });
  };

  const handleDeleteAsset = (name: string) => {
    if (isCurrentlyLocked) {
      triggerToast('Akaun anda telah dikunci oleh Admin. Anda tidak dibenarkan untuk memadam dompet.');
      return;
    }
    setConfirmModal({
      title: 'Padam Dompet',
      message: `Adakah anda mahu memadam akaun "${name}"? Semua data mutasi sejarah tidak akan diganggu.`,
      onConfirm: () => {
        const updated = assets.filter(a => a.name !== name);
        setAssets(updated);
        LocalDB.saveAssets(updated);
        triggerToast('Akaun bank dikeluarkan.');
        setConfirmModal(null);
      }
    });
  };

  const handleDeleteBudget = (b: Budget) => {
    setConfirmModal({
      title: 'Padam Sasaran',
      message: `Padam sasaran limit "${b.category}"?`,
      onConfirm: () => {
        const updated = budgets.filter(item => !(item.month === b.month && item.category === b.category && item.type === b.type));
        setBudgets(updated);
        LocalDB.saveBudgets(updated);
        triggerToast('Sasaran limit dibatalkan.');
        setConfirmModal(null);
      }
    });
  };

  // Export CSV Handler
  const handleExportCSV = () => {
    if (transactions.length === 0) {
      triggerToast('Tiada data perbelanjaan untuk dieksport!');
      return;
    }
    let csvContent = 'data:text/csv;charset=utf-8,ID,Tarikh,Tipe,Kategori/Penerima,Nilai (RM),Dompet,Catatan,Oleh\n';
    transactions.forEach(t => {
      csvContent += `${t.id},${t.date.replace('T', ' ')},${t.type},"${t.category}",${t.amount},"${t.assetName}","${t.note || ''}","${t.user}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `KeuanganGaib_RM_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('Laporan CSV berjaya dimuat turun');
  };

  // Printable layout trigger
  const handlePrintDraft = () => {
    window.print();
  };

  // Calculate Wallet category-by-category values based on Transactions for Progress metrics
  const getAppliedBudgetValue = (b: Budget) => {
    let total = 0;
    const currentYearMonth = new Date().toISOString().substring(0, 7);
    
    let ignoreDate = false;
    let cleanNote = b.note || '';
    if (cleanNote.startsWith('[ALL]')) {
      ignoreDate = true;
    }

    let hasDateRange = b.dateRange && b.dateRange.includes('_');
    let sd = '', ed = '';
    if (hasDateRange) {
      const parts = b.dateRange.split('_');
      sd = parts[0];
      ed = parts[1];
    }

    displayTransactions.forEach(t => {
      // Check type matching
      const isPemasukan = t.type === 'Pemasukan';
      const isPengeluaran = t.type === 'Pengeluaran';
      
      let isMatch = false;
      if (b.type === 'Pemasukan' && isPemasukan) {
        if (b.category.includes('|')) {
          const parts = b.category.split('|');
          const targetAsset = parts[0]?.trim();
          const targetCat = parts[1]?.trim();
          
          const matchAsset = !targetAsset || targetAsset === 'Semua Rekening' || t.assetName.toLowerCase() === targetAsset.toLowerCase();
          const matchCat = !targetCat || targetCat === 'Semua Kategori' || t.category.toLowerCase() === targetCat.toLowerCase();
          isMatch = matchAsset && matchCat;
        } else {
          isMatch = t.assetName.toLowerCase() === b.category.toLowerCase();
        }
      } else if (b.type === 'Pengeluaran' && isPengeluaran && t.category.toLowerCase() === b.category.toLowerCase()) {
        isMatch = true;
      }

      if (isMatch) {
         const tDateOnly = t.date.substring(0, 10);
         if (ignoreDate) {
           total += t.amount;
         } else if (hasDateRange) {
           if (tDateOnly >= sd && tDateOnly <= ed) total += t.amount;
         } else {
           if (t.date.substring(0, 7) === currentYearMonth) total += t.amount;
         }
      }
    });

    return total;
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        {/* Frame Outer Screen (Dynamic Preview Simulator Device) */}
        <div className="w-full max-w-[450px] bg-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-slate-700 relative text-slate-100 font-sans">
          {/* Status bar mock */}
          <div className="bg-slate-950 px-6 py-3 flex justify-between items-center text-xs opacity-70">
            <span>9:41 AM</span>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Online ID-MYR</span>
            </div>
          </div>

          <div className="p-8 md:p-10 flex flex-col justify-center min-h-[500px]">
            {/* Header branding */}
            <div className="text-center mb-8 font-sans">
              <div className="w-24 h-24 mx-auto mb-4 overflow-hidden rounded-2xl shadow-lg border-2 border-blue-500/30 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
                <img 
                  src={loginLogo} 
                  alt="KEUANGAN GAIB Logo" 
                  className="w-full h-full object-cover scale-110 rounded-2xl"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight">KEUANGAN GAIB</h2>
              <p className="text-slate-400 text-sm mt-1">Sistem Pengurusan Wang Ringgit Malaysia (RM)</p>
            </div>

            {/* Error badge */}
            {loginError && (
              <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs rounded-xl p-3 mb-4 text-center">
                {loginError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 tracking-wider uppercase">Nama Pengguna (Username)</label>
                <input 
                  type="text" 
                  value={loginUsername} 
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950/60 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition-all font-medium"
                  placeholder="Masukkan nama pengguna"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 tracking-wider uppercase">Kata Laluan</label>
                <input 
                  type="password" 
                  value={loginPassword} 
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950/60 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition-all"
                  placeholder="Masukkan kata laluan"
                  required
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-3.5 mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 active:scale-[0.98] transition-all text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-600/10"
              >
                Log Masuk Sistem
              </button>
            </form>

            {/* Credentials Tip */}
            <div className="mt-8 text-center bg-slate-900/50 p-3.5 rounded-xl border border-slate-700/40">
              <span className="text-xs text-blue-400 font-extrabold tracking-wide uppercase">Kredential Terpercaya dan Amanah</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-0 md:py-8 flex items-center justify-center">
      {/* Simulation Device Frame Container for Elegant Presentation */}
      <div className="w-full max-w-[500px] bg-slate-50 dark:bg-slate-900 min-h-screen md:min-h-[850px] md:max-h-[900px] md:rounded-[40px] shadow-2xl overflow-hidden flex flex-col relative border border-slate-200 dark:border-slate-800 transition-colors">
        
        {/* Micro-Notification Toast */}
        {toastMessage && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-slate-900/90 dark:bg-white/95 text-white dark:text-slate-900 px-4 py-2 rounded-full text-xs font-bold shadow-xl z-50 flex items-center gap-2 border border-slate-800 dark:border-slate-200 animate-bounce">
            <Check className="w-4 h-4 text-emerald-500" />
            {toastMessage}
          </div>
        )}

        {/* Global Loading Spinner for sync simulation */}
        {isSyncing && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex flex-col items-center justify-center text-white">
            <RefreshCw className="w-10 h-10 text-blue-500 animate-spin mb-4" />
            <h3 className="font-bold tracking-wider">MENYELARAS DATA...</h3>
            <p className="text-slate-400 text-xs mt-1">Mengemas baki Ringgit Malaysia (RM)</p>
          </div>
        )}

        {/* TOP STATUS BAR & HEADER */}
        <header className="bg-white/90 dark:bg-slate-950/90 border-b border-blue-50 dark:border-slate-800 p-5 sticky top-0 z-40 backdrop-blur-md flex flex-col">
          {/* Clock & Core Sync Info */}
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold tracking-wider uppercase mb-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {currentUser.role === 'Admin' ? 'Super Admin Mode' : 'Standard User'}
            </div>
            <span>Online ID-MYR</span>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-extrabold text-blue-900 dark:text-sky-400 tracking-tight">
                {activePage === 'home' && 'Utama'}
                {activePage === 'assets' && 'Walet & Bajet'}
                {activePage === 'report' && 'Analisis Pintar'}
                {activePage === 'history' && 'Mutasi Sesi'}
                {activePage === 'settings' && 'Konfigurasi'}
              </h2>
              <div className="flex flex-col mt-0.5">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">
                  SELAMAT DATANG, {currentUser.fullname}
                </span>
                <span className="text-[9px] text-slate-400 font-medium">
                  {liveClock}
                </span>
              </div>
            </div>

            {/* Header Right Action icons */}
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleDarkMode}
                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center active:scale-95 transition-all"
                title="Tukar Tema"
              >
                {isDarkMode ? <span className="text-sm">☀️</span> : <span className="text-sm">🌙</span>}
              </button>

              <button 
                onClick={() => setActivePage('settings')}
                className={`w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 transition-all ${
                  activePage === 'settings' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <SettingsIcon className="w-4 h-4" />
              </button>

              <button 
                onClick={handleLogout}
                className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center active:scale-95 transition-all"
                title="Keluar"
              >
                <Power className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Admin Multi-User Profile Selector Control */}
          {currentUser.role === 'Admin' && (
            <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs font-sans">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider">KAWALAN PROFIL PRO:</span>
              </div>
              <select
                value={adminFilterUser}
                onChange={(e) => setAdminFilterUser(e.target.value)}
                className="text-xs bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-1.5 px-3 rounded-xl font-extrabold text-blue-600 dark:text-sky-400 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer min-w-[160px]"
              >
                <option value="Semua">🌐 Semua Pengguna</option>
                {users.map((u, idx) => (
                  <option key={idx} value={u.username}>
                    {u.role === 'Admin' ? '👑' : '👤'} {u.fullname} (@{u.username})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Locked Notice Banner */}
          {isCurrentlyLocked && (
            <div className="mt-3.5 p-3 bg-rose-500/10 dark:bg-rose-950/30 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl flex items-center gap-2.5 text-xs font-sans animate-fadeIn">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <div className="flex-1">
                <div className="font-extrabold uppercase text-[9px] tracking-wider mb-0.5">Akaun Anda Dikunci:</div>
                <div className="text-slate-500 dark:text-slate-350 leading-relaxed font-bold">Semua butang & interaksi dibekukan oleh Admin. Sesi ini adalah untuk paparan sahaja (Read-Only).</div>
              </div>
              <Lock className="w-5 h-5 opacity-80" />
            </div>
          )}
        </header>

        {/* SCROLLABLE INTERMEDIATE AREA */}
        <main className="flex-1 overflow-y-auto px-5 pt-4 pb-28 scrollbar-none">
          
          {/* =================================_________ ================================= */}
          {/* SCREEN: HOME */}
          {activePage === 'home' && (
            <div className="space-y-5 animate-fadeIn">
              {/* MAIN WEALTH CARD (Cobalt blue stylized) */}
              <div className="bg-gradient-to-br from-blue-900 via-blue-700 to-indigo-800 rounded-3xl p-6 text-white shadow-xl shadow-blue-900/10 relative overflow-hidden">
                <div className="flex justify-between items-center opacity-90">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-100">Kekayaan Bersih</span>
                  <button 
                    onClick={triggerMockSync}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/15 text-[9px] font-extrabold uppercase tracking-wider"
                  >
                    <RefreshCw className={`w-2.5 h-2.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    Tersinkron
                  </button>
                </div>

                <div className="flex items-center gap-3.5 mt-2.5">
                  <h1 className="text-3xl font-extrabold tracking-tight">
                    {isBalanceHidden ? 'RM ••••••••' : formatMYR(netWealth)}
                  </h1>
                  <button 
                    onClick={toggleBalancePrivacy}
                    className="p-1 px-2 rounded-full bg-white/10 hover:bg-white/20"
                  >
                    {isBalanceHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>

                {/* Sub totals grids */}
                <div className="grid grid-cols-2 gap-3 mt-5">
                  <div className="bg-white/10 rounded-2xl p-3 border border-white/5">
                    <span className="text-[9px] block text-sky-100 font-bold uppercase tracking-wider mb-0.5">MASUK (BULAN INI)</span>
                    <b className="text-sm font-extrabold text-emerald-300">
                      {isBalanceHidden ? 'RM ••••' : formatMYR(totalsThisMonth.income)}
                    </b>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-3 border border-white/5">
                    <span className="text-[9px] block text-sky-100 font-bold uppercase tracking-wider mb-0.5">KELUAR (BULAN INI)</span>
                    <b className="text-sm font-extrabold text-rose-300">
                      {isBalanceHidden ? 'RM ••••' : formatMYR(totalsThisMonth.expense)}
                    </b>
                  </div>
                </div>
              </div>

              {/* QUICK WALLET BALANCES COLUMN */}
              <div>
                <div className="flex items-center gap-2 mb-3.5 px-1">
                  <Wallet className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-widest">Akaun Kewangan</h3>
                </div>

                {/* Horizontal grid list for quick view wallets */}
                <div className="grid grid-cols-2 gap-3">
                  {filteredAssets
                    .filter(a => a.category === 'Dompet')
                    .map((w, idx) => (
                      <div 
                        key={idx}
                        onClick={() => setActivePage('assets')}
                        className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                      >
                        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-slate-900 flex items-center justify-center mb-4">
                          <CreditCard className="w-4.5 h-4.5 text-blue-600 dark:text-sky-400" />
                        </div>
                        <div>
                          <span className="text-[9px] font-extrabold text-slate-400 block tracking-widest uppercase">{w.name}</span>
                          <b className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight mt-0.5 block">
                            {isBalanceHidden ? 'RM •••' : formatMYR(w.value)}
                          </b>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>

              {/* BAR CHART GRAPH: 7-Days Trend (Calculated in custom interactive SVG) */}
              <div className="bg-white dark:bg-slate-950 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Tren Aliran Tunai (7 Hari Lalu)</span>
                  <span className="text-[9px] text-slate-400 font-bold tracking-wider">BAR CHART</span>
                </div>

                {/* Custom Interactive pure-SVG mini bar charts to display incomes vs expenses */}
                <div className="h-44 flex items-end justify-between pt-4 gap-2">
                  {Array.from({ length: 7 }).map((_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (6 - i));
                    const dateStr = d.toISOString().substring(0, 10);
                    const dayLabel = d.toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' });

                    // Sum transactions for day
                    const dayIncoming = transactions
                      .filter(t => t.date.substring(0, 10) === dateStr && t.type === 'Pemasukan')
                      .reduce((sum, t) => sum + t.amount, 0);

                    const dayOutgoing = transactions
                      .filter(t => t.date.substring(0, 10) === dateStr && t.type === 'Pengeluaran')
                      .reduce((sum, t) => sum + t.amount, 0);

                    // Normalize height metrics
                    const maxScale = Math.max(...transactions.map(t => t.amount), 50);
                    const incomingHeight = Math.min((dayIncoming / maxScale) * 100, 100);
                    const outgoingHeight = Math.min((dayOutgoing / maxScale) * 100, 100);

                    return (
                      <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer">
                        <div className="w-full flex justify-center items-end h-[120px] gap-1">
                          {/* Income column (Green) */}
                          <div 
                            style={{ height: `${Math.max(incomingHeight, 2)}%` }}
                            className="w-2 bg-emerald-500 rounded-t-sm transition-all duration-500 group-hover:brightness-105"
                            title={`Masuk: ${formatMYR(dayIncoming)}`}
                          ></div>
                          {/* Expense column (Rose) */}
                          <div 
                            style={{ height: `${Math.max(outgoingHeight, 2)}%` }}
                            className="w-2 bg-rose-500 rounded-t-sm transition-all duration-500 group-hover:brightness-105"
                            title={`Keluar: ${formatMYR(dayOutgoing)}`}
                          ></div>
                        </div>
                        <span className="text-[8px] font-extrabold text-slate-400 mt-2 block tracking-tight text-center whitespace-nowrap">
                          {dayLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RECENT TRANSACTIONS FEED (Shows last 5) */}
              <div>
                <div className="flex justify-between items-center mb-3.5 px-1">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-widest">Aktiviti Semasa</h3>
                  </div>
                  <button 
                    onClick={() => setActivePage('history')}
                    className="text-xs text-blue-600 dark:text-sky-400 font-extrabold uppercase hover:underline"
                  >
                    Semua
                  </button>
                </div>

                <div className="space-y-3">
                  {transactions.slice(0, 5).map((t, idx) => {
                    const isIncome = t.type === 'Pemasukan';
                    return (
                      <div 
                        key={idx}
                        onClick={() => setActivePage('history')}
                        className={`bg-white dark:bg-slate-950 p-4 rounded-2xl border ${
                          isIncome ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-rose-500'
                        } border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between cursor-pointer`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                            isIncome ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/20'
                          }`}>
                            {isIncome ? <ArrowDownLeft className="w-4.5 h-4.5" /> : <ArrowUpRight className="w-4.5 h-4.5" />}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight">{t.category}</h4>
                            <p className="text-slate-400 text-xs mt-1 leading-tight line-clamp-1">{t.note || 'Pencatatan'}</p>
                            <span className="text-[10px] text-slate-400 font-medium block mt-1">{formatCustomDate(t.date)} • {t.user || 'Sistem'}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-slate-400 font-bold block">{t.assetName}</span>
                          <span className={`font-extrabold text-sm ${isIncome ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {isIncome ? '+' : '-'}{formatMYR(t.amount)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* =================================_________ ================================= */}
          {/* SCREEN: WALLETS/ASSETS & BUDGETS */}
          {activePage === 'assets' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* TARGET/BUDGETS SECTION */}
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-widest">Sasaran & Had Belanja</h3>
                  </div>
                  <button 
                    onClick={() => setSettingsModal({ type: 'add_budget', data: { type: 'Pengeluaran' } })}
                    className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full transition-all"
                  >
                    + Tetap Sasaran
                  </button>
                </div>

                {budgets.length === 0 ? (
                  <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl text-center border border-slate-100 dark:border-slate-800 text-slate-400 text-xs">
                    Tiada had belanjawan ditetapkan untuk bulan ini.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {budgets.map((b, idx) => {
                      const totalCatur = getAppliedBudgetValue(b);
                      const percent = b.limit > 0 ? Math.min(Math.round((totalCatur / b.limit) * 100), 100) : 0;
                      const isLimitOver = totalCatur > b.limit;
                      
                      return (
                        <div key={idx} className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative group overflow-hidden">
                          {/* Edit / Delete small top buttons */}
                          <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => {
                                setBudgetInputCat(b.category);
                                setBudgetInputLimit(String(b.limit));
                                if (b.dateRange.includes('_')) {
                                  const parts = b.dateRange.split('_');
                                  setBudgetInputStart(parts[0]);
                                  setBudgetInputEnd(parts[1]);
                                }
                                setBudgetInputIgnoreDate(b.note.startsWith('[ALL]'));
                                setBudgetInputNote(b.note.startsWith('[ALL]') ? b.note.replace('[ALL]', '').trim() : b.note);
                                setSettingsModal({ type: 'edit_budget', data: { type: b.type, budget: b } });
                              }}
                              className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button 
                              onClick={() => handleDeleteBudget(b)}
                              className="w-6 h-6 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="pr-12">
                            <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full inline-block mb-2 ${
                              b.type === 'Pemasukan' 
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' 
                                : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20'
                            }`}>
                              {b.type === 'Pemasukan' ? 'Sasaran Impian' : 'Kekang Perbelanjaan'}
                            </span>

                            <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm leading-tight">
                              {b.category.includes('|') ? b.category.split('|')[1] : b.category}
                            </h4>
                            
                            {b.note && (
                              <p className="text-slate-400 text-xs mt-1 leading-tight">{b.note.replace('[ALL]', '').trim()}</p>
                            )}
                          </div>

                          {/* Progress Metrics */}
                          <div className="mt-4 space-y-1.5">
                            <div className="flex justify-between items-baseline text-xs">
                              <span className="text-slate-400">Tercatat: <b className="text-slate-700 dark:text-slate-200">{formatMYR(totalCatur)}</b></span>
                              <span className="text-slate-400">Siling/Limit: <b className="text-slate-800 dark:text-slate-100">{formatMYR(b.limit)}</b></span>
                            </div>

                            <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
                              <div 
                                style={{ width: `${percent}%` }}
                                className={`h-full rounded-full transition-all duration-500 ${
                                  b.type === 'Pemasukan' 
                                    ? 'bg-emerald-500' 
                                    : isLimitOver ? 'bg-rose-500 animate-pulse' : percent > 85 ? 'bg-amber-500' : 'bg-blue-600'
                                }`}
                              ></div>
                            </div>

                            <div className="flex justify-between items-center text-[10px]">
                              <span className={`font-bold uppercase ${
                                b.type === 'Pemasukan' 
                                  ? (percent >= 100 ? 'text-emerald-500' : 'text-slate-400')
                                  : (isLimitOver ? 'text-rose-500' : 'text-slate-400')
                              }`}>
                                {b.type === 'Pemasukan' 
                                  ? (percent >= 100 ? 'Sasaran Kejayaan!' : 'Berusaha mencatatkan baki')
                                  : (isLimitOver ? 'AMARAN: Melebihi Bajet!' : 'Belanja Terkawal')
                                }
                              </span>
                              <span className="font-extrabold text-slate-700 dark:text-slate-300">{percent}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ACCOUNT POCKETS LISTING */}
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-widest">Semua Pek / Dompet</h3>
                  </div>
                  <button 
                    onClick={() => {
                      setAssetInputName('');
                      setAssetInputNoRek('');
                      setAssetInputVal('');
                      setAssetInputOwner(currentUser?.username || 'admin');
                      setSettingsModal({ type: 'add_asset' });
                    }}
                    className="px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/15 border border-blue-600/20 text-blue-600 dark:text-sky-400 text-xs font-bold rounded-full transition-all"
                  >
                    + Bina Pek
                  </button>
                </div>

                <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredAssets.map((a, idx) => (
                    <div key={idx} className="flex justify-between items-center py-3.5 first:pt-0 last:pb-0 group">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <b className="text-sm font-extrabold text-slate-800 dark:text-slate-150">{a.name}</b>
                          <span className="text-[9px] text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-full font-bold uppercase">{a.category}</span>
                          {currentUser?.role === 'Admin' && a.owner && (
                            <span className="text-[9px] text-blue-600 dark:text-sky-400 bg-blue-50 dark:bg-slate-900 border border-blue-100 dark:border-slate-800/40 px-2 py-0.5 rounded-md font-extrabold uppercase whitespace-nowrap">
                              👤 Pemilik: {a.owner}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 font-mono tracking-wide mt-1 block">
                          No. Rek: {a.no_rek}
                        </span>
                      </div>

                      <div className="text-right flex items-center gap-3">
                        <b className="text-sm text-blue-600 dark:text-sky-400 font-extrabold">
                          {isBalanceHidden ? 'RM •••••' : formatMYR(a.value)}
                        </b>
                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={() => {
                              setAssetInputName(a.name);
                              setAssetInputNoRek(a.no_rek);
                              setAssetInputVal(new Intl.NumberFormat('en-MY').format(a.value));
                              setAssetInputOwner(a.owner || 'admin');
                              setSettingsModal({ type: 'edit_asset', data: a });
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all font-bold"
                            title="Kemaskini"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteAsset(a.name)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 transition-all"
                            title="Padam"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* =================================_________ ================================= */}
          {/* SCREEN: ANALYTICS REPORT */}
          {activePage === 'report' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* FILTERS PANEL */}
              <div className="bg-white dark:bg-slate-950 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Tempoh & Dompet Laporan</span>
                  <button 
                    onClick={() => {
                      setRepMonthFilter(String(new Date().getMonth() + 1).padStart(2, '0'));
                      setRepAssetFilter('Semua');
                    }}
                    className="text-[9px] font-bold text-rose-500 uppercase tracking-widest hover:underline"
                  >
                    Set Semula
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Pilih Bulan</label>
                    <select 
                      value={repMonthFilter}
                      onChange={(e) => setRepMonthFilter(e.target.value)}
                      className="w-full text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl p-2.5 focus:outline-none focus:border-blue-500 text-slate-700 dark:text-slate-200"
                    >
                      <option value="Semua">Semua Bulan</option>
                      <option value="01">Januari</option>
                      <option value="02">Februari</option>
                      <option value="03">Maret</option>
                      <option value="04">April</option>
                      <option value="05">Mei</option>
                      <option value="06">Jun</option>
                      <option value="07">Julai</option>
                      <option value="08">Ogos</option>
                      <option value="09">September</option>
                      <option value="10">Oktober</option>
                      <option value="11">November</option>
                      <option value="12">Desember</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Dompet Tabung</label>
                    <select 
                      value={repAssetFilter}
                      onChange={(e) => setRepAssetFilter(e.target.value)}
                      className="w-full text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl p-2.5 focus:outline-none focus:border-blue-500 text-slate-700 dark:text-slate-200"
                    >
                      <option value="Semua">Semua Dompet</option>
                      {assets.filter(a => a.category === 'Dompet').map((w, idx) => (
                        <option key={idx} value={w.name}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* FLOW CARD */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-500/10 border border-emerald-500/15 rounded-2xl p-4">
                  <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-widest">MASUK ALiran</span>
                  <h3 className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                    {formatMYR(reportStats.totalIncome)}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-medium block mt-1">{reportStats.incomeCount} kali rekod</span>
                </div>

                <div className="bg-rose-500/10 border border-rose-500/15 rounded-2xl p-4">
                  <span className="text-[9px] text-rose-600 dark:text-rose-400 font-extrabold uppercase tracking-widest">BELANJA KELUAR</span>
                  <h3 className="text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
                    {formatMYR(reportStats.totalExpense)}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-medium block mt-1">{reportStats.expenseCount} kali rekod</span>
                </div>
              </div>

              {/* SMART ADVEC / AI NARRATIVE CHAT */}
              <div className="bg-gradient-to-br from-blue-50 to-sky-100 dark:from-slate-950 dark:to-slate-900 rounded-2xl p-5 border border-blue-100 dark:border-slate-800 shadow-sm relative">
                <div className="flex items-center gap-2 mb-2 text-blue-900 dark:text-sky-450">
                  <Cpu className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                  <h4 className="font-extrabold text-xs uppercase tracking-wider">{smartAdvice.title}</h4>
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
                  {smartAdvice.text}
                </p>
                {smartAdvice.tip && (
                  <div className="mt-3.5 pt-3.5 border-t border-blue-200/50 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-blue-800 dark:text-sky-400 uppercase tracking-widest block mb-0.5">Saranan Pakar:</span>
                    <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed italic">
                      "{smartAdvice.tip}"
                    </p>
                  </div>
                )}
              </div>

              {/* PIE CHART / PILLAR OF EXPENDITURE GRID LIST */}
              <div>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <Layers className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-widest">Pilar Analisis Belanja</h3>
                </div>

                <div className="bg-white dark:bg-slate-950 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                  {/* Category Donut Visual Simulation of pillars */}
                  <div className="flex justify-center py-4">
                    <div className="relative w-40 h-40 flex items-center justify-center">
                      <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        {/* Interactive dynamic segments mapped natively representation */}
                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#e2e8f0" strokeWidth="8" />
                        {(() => {
                          let accumulatedPercentage = 0;
                          const pillarEntries = Object.entries(reportStats.pilarExpenseMap as Record<string, number>).filter(([_, val]) => (val as number) > 0);
                          return pillarEntries.map(([name, val], i) => {
                            const valNum = val as number;
                            const pct = reportStats.totalExpense > 0 ? (valNum / reportStats.totalExpense) * 100 : 0;
                            const dashArray = `${pct} ${100 - pct}`;
                            const dashOffset = 100 - accumulatedPercentage;
                            accumulatedPercentage += pct;

                            const colors = ['#2563eb', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#14b8a6', '#64748b'];
                            const selectedColor = colors[i % colors.length];

                            return (
                              <circle 
                                key={i}
                                cx="50" 
                                cy="50" 
                                r="40" 
                                fill="transparent" 
                                stroke={selectedColor} 
                                strokeWidth="10" 
                                strokeDasharray={`${pct * 2.51} 251`} // radius 40 * 2 * pi = 251 approx
                                strokeDashoffset={(dashOffset / 100) * 251}
                                className="transition-all duration-700"
                              />
                            );
                          });
                        })()}
                      </svg>
                      <div className="text-center z-10">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">JUMLAH BELANJA</span>
                        <b className="text-base font-black text-slate-800 dark:text-slate-100 block tracking-tight">
                          {formatMYR(reportStats.totalExpense)}
                        </b>
                      </div>
                    </div>
                  </div>

                  {/* Pillars detail items */}
                  <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {Object.entries(reportStats.pilarExpenseMap as Record<string, number>).filter(([_, val]) => (val as number) > 0).map(([name, val], i) => {
                      const valNum = val as number;
                      const pct = reportStats.totalExpense > 0 ? Math.round((valNum / reportStats.totalExpense) * 100) : 0;
                      const colors = ['bg-blue-600', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-purple-500', 'bg-teal-500', 'bg-slate-500'];
                      const selectedColor = colors[i % colors.length];
                      return (
                        <div key={i} className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${selectedColor}`}></span>
                            <span className="text-slate-600 dark:text-slate-400 font-medium">{name}</span>
                          </div>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {formatMYR(valNum)} ({pct}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* REPORT BY CATEGORY TABLE */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <TrendingDown className="w-4 h-4 text-rose-500" />
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-widest">Pecahan Mengikut Kategori</h3>
                </div>

                <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
                  {sortedReportCategories.map((item, idx) => {
                    const percentage = reportStats.totalExpense > 0 ? Math.round((item.value / reportStats.totalExpense) * 100) : 0;
                    return (
                      <div key={idx} className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                        <div>
                          <b className="text-slate-800 dark:text-slate-250 text-sm font-extrabold">{item.name}</b>
                          <span className="text-[10px] text-slate-400 font-medium block mt-0.5">{percentage}% dari had belanja bulanan</span>
                        </div>
                        <b className="text-slate-800 dark:text-slate-100 text-sm font-extrabold">{formatMYR(item.value)}</b>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* EXPORTS BUTTONS BOX */}
              <div className="bg-white dark:bg-slate-950 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Sediakan Laporan Bertulis Resmi</span>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={handleExportCSV}
                    className="flex items-center justify-center gap-1.5 py-3 border-2 border-blue-500/20 text-blue-600 dark:text-sky-400 text-xs font-black uppercase rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> CSV Laporan
                  </button>
                  <button 
                    onClick={handlePrintDraft}
                    className="flex items-center justify-center gap-1.5 py-3 bg-blue-600 text-white text-xs font-black uppercase rounded-xl hover:opacity-90 transition-all cursor-pointer shadow-lg shadow-blue-600/10"
                  >
                    <FileText className="w-3.5 h-3.5" /> Cetak Draft
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* =================================_________ ================================= */}
          {/* SCREEN: MUTASI HISTORY LIST */}
          {activePage === 'history' && (
            <div className="space-y-5 animate-fadeIn">
              
              {/* ADVANCED HISTORY FILTER DRAWER */}
              <div className="bg-white dark:bg-slate-950 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Tapis Rekod Mutasi Sesi</span>
                  <button 
                    onClick={() => {
                      setHistTypeFilter('Semua');
                      setHistAssetFilter('Semua');
                      setHistStartDate('');
                      setHistEndDate('');
                      triggerToast('Tapisan dibersihkan.');
                    }}
                    className="text-[9px] font-extrabold text-rose-500 uppercase tracking-widest hover:underline"
                  >
                    Set Semula
                  </button>
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-900 rounded-xl p-1 justify-between text-xs font-bold divide-x divide-slate-200 dark:divide-slate-800 text-slate-500">
                  <button 
                    onClick={() => setHistTypeFilter('Semua')}
                    className={`flex-1 text-center py-2 rounded-lg ${histTypeFilter === 'Semua' ? 'bg-white dark:bg-slate-850 text-blue-600 shadow-sm' : ''}`}
                  >
                    Semua
                  </button>
                  <button 
                    onClick={() => setHistTypeFilter('Pemasukan')}
                    className={`flex-1 text-center py-2 rounded-lg ${histTypeFilter === 'Pemasukan' ? 'bg-white dark:bg-slate-850 text-emerald-600 shadow-sm' : ''}`}
                  >
                    Inflow
                  </button>
                  <button 
                    onClick={() => setHistTypeFilter('Pengeluaran')}
                    className={`flex-1 text-center py-2 rounded-lg ${histTypeFilter === 'Pengeluaran' ? 'bg-white dark:bg-slate-850 text-rose-600 shadow-sm' : ''}`}
                  >
                    Outflow
                  </button>
                </div>

                {/* Specific ranges inputs */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Tarikh Mula</label>
                    <input 
                      type="date"
                      value={histStartDate}
                      onChange={(e) => setHistStartDate(e.target.value)}
                      className="w-full text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl p-2.5 text-slate-750 dark:text-slate-100 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Tarikh Tamat</label>
                    <input 
                      type="date"
                      value={histEndDate}
                      onChange={(e) => setHistEndDate(e.target.value)}
                      className="w-full text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl p-2.5 text-slate-750 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Dari Dompet</label>
                  <select 
                    value={histAssetFilter}
                    onChange={(e) => setHistAssetFilter(e.target.value)}
                    className="w-full text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl p-2.5 text-slate-700 dark:text-slate-200"
                  >
                    <option value="Semua">Semua Dompet</option>
                    {assets.filter(a => a.category === 'Dompet').map((w, idx) => (
                      <option key={idx} value={w.name}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* TRANSACTIONS CONTAINER LIST */}
              <div className="space-y-3">
                {filteredHistory.length === 0 ? (
                  <div className="bg-white dark:bg-slate-950 p-10 py-12 rounded-2xl text-center border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 text-xs">Tiada rekod mutasi sejarah sepadan dengan tapisan semasa.</span>
                  </div>
                ) : (
                  filteredHistory.map((t, idx) => {
                    const isInc = t.type === 'Pemasukan';
                    return (
                      <div 
                        key={idx}
                        className={`bg-white dark:bg-slate-950 p-4 rounded-2xl border ${
                          isInc ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-rose-500'
                        } border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group relative`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                            isInc ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/20'
                          }`}>
                            {isInc ? <ArrowDownLeft className="w-4.5 h-4.5" /> : <ArrowUpRight className="w-4.5 h-4.5" />}
                          </div>
                          <div>
                            <div className="flex items-baseline gap-2">
                              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight">{t.category}</h4>
                              <span className="text-[9px] text-slate-400 font-bold uppercase">{t.type}</span>
                            </div>
                            <p className="text-slate-400 text-xs mt-1 leading-tight">{t.note || 'Transaksi Masuk/Keluar'}</p>
                            
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[10px] text-slate-400 font-medium">{formatCustomDate(t.date)} • {t.user}</span>
                              {t.receiptUrl && (
                                <a 
                                  href={t.receiptUrl} 
                                  target="_blank" 
                                  referrerPolicy="no-referrer"
                                  className="text-[9px] px-2 py-0.5 rounded bg-blue-50 text-blue-600 hover:opacity-80 flex items-center gap-0.5 font-bold"
                                >
                                  <ImageIcon className="w-2.5 h-2.5" /> Resit
                                </a>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex items-center gap-3">
                          <div>
                            <span className="text-[9px] text-slate-400 font-bold block">{t.assetName}</span>
                            <span className={`font-black text-sm block ${isInc ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {isInc ? '+' : '-'}{formatMYR(t.amount)}
                            </span>
                          </div>
                          <button 
                            onClick={() => handleDeleteTx(t.id)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 opacity-0 group-hover:opacity-100 transition-all"
                            title="Padam"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* =================================_________ ================================= */}
          {/* SCREEN: CONFIGURATION & SETTINGS */}
          {activePage === 'settings' && (
            <div className="space-y-6 animate-fadeIn text-xs">
              
              {/* TOP HEADER SECTION */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900 rounded-2xl p-4 border border-blue-50 dark:border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-blue-900 dark:text-sky-450 text-sm">Konfigurasi & Master Data</h4>
                  <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Kawal had akses dan kategori belanjawan</p>
                </div>
              </div>

               {/* LIST USERS ACCESSIBLE SECTION */}
              {currentUser.role === 'Admin' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">Akses Pengguna ({users.length})</span>
                    <button 
                      onClick={() => {
                        setUserInputFullname('');
                        setUserInputUsername('');
                        setUserInputEmail('');
                        setUserInputPassword('');
                        setUserInputRole('User');
                        setSettingsModal({ type: 'add_user' });
                      }}
                      className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center hover:opacity-90 active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 divide-y divide-slate-100 dark:divide-slate-800 space-y-1.5">
                    {users.map((u, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2.5 first:pt-0 last:pb-0 group gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-slate-800 dark:text-slate-200">@{u.username}</span>
                            <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${
                              u.role === 'Admin' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/20' : 'bg-slate-100 text-slate-600 dark:bg-slate-900'
                            }`}>{u.role}</span>
                            {u.isLocked && (
                              <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
                                <Lock className="w-2.5 h-2.5" /> DIKUNCI
                              </span>
                            )}
                          </div>
                          <span className="text-slate-400 block mt-0.5 text-[10px]">{u.fullname} • {u.email || 'Tiada e-mel'}</span>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          {u.role !== 'Admin' && (
                            <button 
                              onClick={() => {
                                setAssetInputName('');
                                setAssetInputNoRek('');
                                setAssetInputVal('');
                                setAssetInputOwner(u.username);
                                setSettingsModal({ type: 'add_asset' });
                              }}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-sky-400 border border-blue-100 dark:border-blue-900/40 rounded-lg text-[9px] font-extrabold uppercase flex items-center gap-1 transition-all"
                              title="Tambah Dompet/Saldo untuk user ini"
                            >
                              <Plus className="w-2.5 h-2.5" /> Dompet
                            </button>
                          )}
                          {u.username !== 'admin' && (
                            <button
                              onClick={() => toggleUserLock(u.username)}
                              className={`p-1 rounded flex items-center justify-center transition-all ${
                                u.isLocked 
                                  ? 'bg-rose-100 text-rose-600 hover:bg-rose-200 dark:bg-rose-950 dark:text-rose-400' 
                                  : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400'
                              }`}
                              title={u.isLocked ? "Buka kuncian tombol user" : "Kunci semua tombol user"}
                            >
                              {u.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                            </button>
                          )}
                          <button 
                            onClick={() => {
                              setUserInputFullname(u.fullname);
                              setUserInputUsername(u.username);
                              setUserInputEmail(u.email);
                              setUserInputRole(u.role);
                              setSettingsModal({ type: 'edit_user', data: u });
                            }}
                            className="p-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                            title="Kemaskini Profil"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(u.username)}
                            className="p-1 rounded bg-rose-50 hover:bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400"
                            title="Padam Pengguna"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* LIST CATEGORIES & PILLARS SECTION */}
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">Pilar & Kategori Belanja</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setPilarInputName('');
                        setSettingsModal({ type: 'add_pilar', data: 'Pengeluaran' });
                      }}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold rounded-lg"
                    >
                      + Pilar
                    </button>
                    <button 
                      onClick={() => {
                        setCatInputName('');
                        setCatInputPilar(pilars.filter(p => p.type === 'Pengeluaran')[0]?.name || '');
                        setSettingsModal({ type: 'add_category', data: 'Pengeluaran' });
                      }}
                      className="px-2.5 py-1 bg-blue-600/10 hover:bg-blue-600/15 border border-blue-600/20 text-blue-600 dark:text-sky-400 text-[10px] font-bold rounded-lg"
                    >
                      + Kategori
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 space-y-4">
                  {['Pemasukan', 'Pengeluaran'].map((txType, index) => {
                    const typeCats = categories.filter(c => c.type === txType);
                    return (
                      <div key={index} className="space-y-2">
                        <h4 className={`font-black uppercase tracking-wider border-b pb-1.5 ${
                          txType === 'Pemasukan' ? 'text-emerald-500' : 'text-rose-500'
                        }`}>{txType === 'Pemasukan' ? 'Pemasukan (Inflow)' : 'Pengeluaran (Outflow)'}</h4>

                        {typeCats.length === 0 ? (
                          <span className="text-slate-400 block text-center py-2">Tiada kategori</span>
                        ) : (
                          <div className="divide-y divide-slate-100 dark:divide-slate-900">
                            {typeCats.map((c, i) => (
                              <div key={i} className="flex justify-between items-center py-1.5 group">
                                <div>
                                  <span className="font-extrabold text-slate-800 dark:text-slate-200">{c.name}</span>
                                  {c.pilar && (
                                    <span className="text-[9px] block text-slate-400 font-bold uppercase tracking-wider mt-0.5">Pilar: {c.pilar}</span>
                                  )}
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                  <button 
                                    onClick={() => {
                                      setCatInputName(c.name);
                                      setCatInputPilar(c.pilar || '');
                                      setSettingsModal({ type: 'edit_category', data: c });
                                    }}
                                    className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteCategory(c)}
                                    className="p-1 rounded bg-rose-50 hover:bg-rose-105 text-rose-600"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </main>

        {/* BOTTOM FIXED FLOATING ACTION BUTTON CONTAINER & TABS */}
        <div className="absolute bottom-[20px] left-1/2 -translate-x-1/2 z-35 flex items-center pointer-events-none">
          <button 
            onClick={openAddTransaction}
            disabled={isCurrentlyLocked}
            className={`w-16 h-16 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl active:scale-95 transition-all outline-none border-4 pointer-events-auto ${
              isCurrentlyLocked 
                ? 'bg-rose-500 border-rose-200 dark:border-rose-950 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 border-slate-50 dark:border-slate-900'
            }`}
            title={isCurrentlyLocked ? "Butang dikunci oleh Admin" : "Tambah Transaksi"}
          >
            {isCurrentlyLocked ? <Lock className="w-6 h-6 animate-pulse" /> : <Plus className="w-8 h-8" />}
          </button>
        </div>

        {/* BOTTOM NAVIGATION TABS FRAME CONTAINER */}
        <nav className="absolute bottom-0 left-0 w-full h-[85px] bg-white/95 dark:bg-slate-950/95 border-t border-slate-100 dark:border-slate-800 backdrop-blur-md flex justify-between items-center px-6 pb-2.5 z-30 md:rounded-b-[40px] shadow-lg">
          <button 
            onClick={() => { setActivePage('home'); }}
            className={`flex flex-col items-center gap-1 flex-1 py-2 ${activePage === 'home' ? 'text-blue-600 dark:text-sky-400 font-extrabold' : 'text-slate-300'}`}
          >
            <span className="text-xs">🏠</span>
            <span className="text-[9px] font-extrabold uppercase tracking-widest">Utama</span>
          </button>

          <button 
            onClick={() => { setActivePage('assets'); }}
            className={`flex flex-col items-center gap-1 flex-1 py-2 ${activePage === 'assets' ? 'text-blue-600 dark:text-sky-400 font-extrabold' : 'text-slate-300'}`}
          >
            <span className="text-xs">📂</span>
            <span className="text-[9px] font-extrabold uppercase tracking-widest">Walet</span>
          </button>

          <div className="w-16"></div> {/* Offset center space for float FAB */}

          <button 
            onClick={() => { setActivePage('report'); }}
            className={`flex flex-col items-center gap-1 flex-1 py-2 ${activePage === 'report' ? 'text-blue-600 dark:text-sky-400 font-extrabold' : 'text-slate-300'}`}
          >
            <span className="text-xs">📊</span>
            <span className="text-[9px] font-extrabold uppercase tracking-widest">Pintar</span>
          </button>

          <button 
            onClick={() => { setActivePage('history'); }}
            className={`flex flex-col items-center gap-1 flex-1 py-2 ${activePage === 'history' ? 'text-blue-600 dark:text-sky-400 font-extrabold' : 'text-slate-300'}`}
          >
            <span className="text-xs">⏳</span>
            <span className="text-[9px] font-extrabold uppercase tracking-widest">Mutasi</span>
          </button>
        </nav>

        {/* MODAL WINDOWS OVERLAYS */}
        {/* ======================= TRANSACTION CREATOR DIALOG OVERLAY ======================= */}
        {isAddTxOpen && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-end justify-center">
            <div className="bg-white dark:bg-slate-900 w-full max-w-[500px] rounded-t-[40px] shadow-2xl p-6 pb-12 overflow-y-auto max-h-[85vh] animate-slideUp text-xs font-sans text-slate-800 dark:text-white border-t border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-center mb-5 border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">Catat Transaksi Baru (RM)</h3>
                <button 
                  onClick={() => setIsAddTxOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 flex items-center justify-center font-bold"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveTransaction} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Tarikh Transaksi</label>
                    <input 
                      type="date"
                      value={txDate}
                      onChange={(e) => setTxDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl font-bold font-mono focus:outline-none text-slate-800 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Tipe Aliran</label>
                    <select 
                      value={txType}
                      onChange={(e) => handleTxTypeChange(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl font-bold focus:outline-none text-slate-800 dark:text-white"
                    >
                      <option value="Pengeluaran">Pengeluaran (-)</option>
                      <option value="Pemasukan">Pemasukan (+)</option>
                      <option value="Transfer">Pindahan Wang (↔)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Nilai RM (Malaysian Ringgit)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400">RM</span>
                    <input 
                      type="text"
                      inputMode="numeric"
                      value={txAmountStr}
                      onChange={(e) => handleAmountInMYR(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-lg font-black tracking-tight text-blue-600 focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                      {txType === 'Transfer' ? 'Wallet Sumber (Asal)' : 'Dibelanjakan Dari'}
                    </label>
                    <select 
                      value={txAsset}
                      onChange={(e) => setTxAsset(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl font-bold focus:outline-none text-slate-800 dark:text-white"
                    >
                      {assets.filter(a => a.category === 'Dompet').map((w, idx) => (
                        <option key={idx} value={w.name}>{w.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                      {txType === 'Transfer' ? 'Wallet Penerima (Sasaran)' : 'Kategori Aliran'}
                    </label>
                    <select 
                      value={txCategory}
                      onChange={(e) => setTxCategory(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl font-bold focus:outline-none text-slate-800 dark:text-white"
                    >
                      {txType === 'Transfer' ? (
                        assets.filter(a => a.category === 'Dompet').map((w, idx) => (
                          <option key={idx} value={w.name}>{w.name}</option>
                        ))
                      ) : (
                        categories.filter(c => c.type === txType).map((cat, idx) => (
                          <option key={idx} value={cat.name}>{cat.name}</option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Nota Catatan (Keterangan)</label>
                  <input 
                    type="text"
                    value={txNote}
                    onChange={(e) => setTxNote(e.target.value)}
                    placeholder="Contoh: Beli teh tarik, makan tengah hari..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Muat Naik Gambar Resit (Opsional)</label>
                  <input 
                    type="file"
                    accept="image/*"
                    onChange={handleReceiptUpload}
                    className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-extrabold file:uppercase file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {txReceiptBase64 && (
                    <div className="mt-3 relative w-20 h-20 rounded-xl overflow-hidden border border-slate-300">
                      <img src={txReceiptBase64} alt="Receipt preview" className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => setTxReceiptBase64(null)}
                        className="absolute top-1 right-1 bg-rose-500/85 text-white rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsAddTxOpen(false)}
                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 font-bold uppercase tracking-wider rounded-xl transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 font-bold uppercase tracking-wider rounded-xl text-white shadow-lg shadow-blue-600/10 active:scale-95 transition-all"
                  >
                    Rekod (RM)
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================= MASTER CONFIG MODALS SYSTEM ======================= */}
        {settingsModal && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-[420px] rounded-3xl shadow-2xl p-6 overflow-y-auto max-h-[85vh] animate-fadeIn text-xs text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-center mb-4 border-b dark:border-slate-800 pb-2.5">
                <h3 className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">
                  {settingsModal.type === 'add_user' && 'Daftar Pengguna Baru'}
                  {settingsModal.type === 'edit_user' && 'Edit Akaun Pengguna'}
                  {settingsModal.type === 'add_category' && `Tambah Kategori (${settingsModal.data})`}
                  {settingsModal.type === 'edit_category' && `Edit Kategori (${settingsModal.data.name})`}
                  {settingsModal.type === 'add_pilar' && `Tambah Pilar Pentadbiran`}
                  {settingsModal.type === 'add_asset' && 'Bina Dompet Simpanan Baru'}
                  {settingsModal.type === 'edit_asset' && 'Kemaskini Dompet'}
                  {settingsModal.type === 'add_budget' && 'Tetapkan Sasaran Belanjawan'}
                  {settingsModal.type === 'edit_budget' && 'Ubah Sasaran Belanjawan'}
                </h3>
                <button onClick={closeSettingsModal} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSettingsSubmit} className="space-y-4">
                
                {/* Mode: User Form fields */}
                {(settingsModal.type === 'add_user' || settingsModal.type === 'edit_user') && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Nama Penuh</label>
                      <input 
                        type="text"
                        value={userInputFullname}
                        onChange={(e) => setUserInputFullname(e.target.value)}
                        placeholder="Contoh: Budi Santoso"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 p-2.5 rounded-xl font-bold"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Nama Log Masuk (Username)</label>
                      <input 
                        type="text"
                        value={userInputUsername}
                        onChange={(e) => setUserInputUsername(e.target.value)}
                        placeholder="Contoh: budi123"
                        disabled={settingsModal.type === 'edit_user'}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 p-2.5 rounded-xl font-mono text-xs font-bold disabled:opacity-60"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Alamat E-mel</label>
                      <input 
                        type="email"
                        value={userInputEmail}
                        onChange={(e) => setUserInputEmail(e.target.value)}
                        placeholder="Contoh: budi@gmail.my"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 p-2.5 rounded-xl font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Peranan Akses</label>
                      <select 
                        value={userInputRole}
                        onChange={(e) => setUserInputRole(e.target.value as any)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 p-2.5 rounded-xl font-bold"
                      >
                        <option value="User">Standard User Only</option>
                        <option value="Admin">System Administrator</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Mode: Category Form fields */}
                {(settingsModal.type === 'add_category' || settingsModal.type === 'edit_category') && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Nama Kategori</label>
                      <input 
                        type="text"
                        value={catInputName}
                        onChange={(e) => setCatInputName(e.target.value)}
                        placeholder="Contoh: Jajanan Luar..."
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 p-2.5 rounded-xl font-bold"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Pilih Pilar Penyatuan (Opsional)</label>
                      <select 
                        value={catInputPilar}
                        onChange={(e) => setCatInputPilar(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 p-2.5 rounded-xl font-bold"
                      >
                        <option value="">(Bukan di bawah mana-mana pilar)</option>
                        {pilars
                          .filter(p => p.type === (settingsModal.type === 'add_category' ? settingsModal.data : settingsModal.data.type))
                          .map((p, idx) => (
                            <option key={idx} value={p.name}>{p.name}</option>
                          ))
                        }
                      </select>
                    </div>
                  </div>
                )}

                {/* Mode: Pilar Form fields */}
                {settingsModal.type === 'add_pilar' && (
                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Nama Pilar</label>
                    <input 
                      type="text"
                      value={pilarInputName}
                      onChange={(e) => setPilarInputName(e.target.value)}
                      placeholder="Contoh: Belanja Hiburan, Rumah..."
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 p-2.5 rounded-xl font-bold"
                      required
                    />
                  </div>
                )}

                {/* Mode: Asset/Wallet Form fields */}
                {(settingsModal.type === 'add_asset' || settingsModal.type === 'edit_asset') && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Nama Dompet / Bank Pek</label>
                      <input 
                        type="text"
                        value={assetInputName}
                        onChange={(e) => setAssetInputName(e.target.value)}
                        placeholder="Contoh: Maybank Baru, CIMB Utama..."
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 p-2.5 rounded-xl font-bold"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Nomor Akaun (Simpan Rekod)</label>
                      <input 
                        type="text"
                        value={assetInputNoRek}
                        onChange={(e) => setAssetInputNoRek(e.target.value)}
                        placeholder="Contoh: 1640001882"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 p-2.5 rounded-xl font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Baki Awal / Anggaran RM</label>
                      <input 
                        type="text"
                        inputMode="numeric"
                        value={assetInputVal}
                        onChange={(e) => handleAssetAmountInMYR(e.target.value)}
                        placeholder="Contoh: 5,000"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 p-2.5 rounded-xl font-bold"
                        required
                      />
                    </div>

                    {currentUser?.role === 'Admin' && (
                      <div>
                        <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Pemilik Dompet (Akaun)</label>
                        <select 
                          value={assetInputOwner}
                          onChange={(e) => setAssetInputOwner(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 p-2.5 rounded-xl font-bold text-slate-800 dark:text-gray-100"
                          required
                        >
                          {users.map((u, idx) => (
                            <option key={idx} value={u.username}>{u.fullname} (@{u.username})</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* Mode: Target Budgeting Form fields */}
                {(settingsModal.type === 'add_budget' || settingsModal.type === 'edit_budget') && (
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Pilih Kategori Perbelanjaan</label>
                      <select 
                        value={budgetInputCat}
                        onChange={(e) => setBudgetInputCat(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 p-2.5 rounded-xl font-bold text-slate-800"
                        required
                      >
                        <option value="">-- PILIH SASARAN --</option>
                        {categories
                          .filter(c => c.type === (settingsModal.type === 'add_budget' ? settingsModal.data.type : settingsModal.data.type))
                          .map((c, idx) => (
                            <option key={idx} value={c.name}>{c.name}</option>
                          ))
                        }
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Siling Sasaran Limit (RM)</label>
                      <input 
                        type="text"
                        inputMode="numeric"
                        value={budgetInputLimit}
                        onChange={(e) => handleBudgetLimitInMYR(e.target.value)}
                        placeholder="Contoh: 1,500"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 p-2.5 rounded-xl font-bold"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Rentang Mula</label>
                        <input 
                          type="date"
                          value={budgetInputStart}
                          onChange={(e) => setBudgetInputStart(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-150 p-2 rounded-xl text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Rentang Tamat</label>
                        <input 
                          type="date"
                          value={budgetInputEnd}
                          onChange={(e) => setBudgetInputEnd(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-150 p-2 rounded-xl text-xs"
                        />
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={budgetInputIgnoreDate}
                          onChange={(e) => setBudgetInputIgnoreDate(e.target.checked)}
                          className="mt-1"
                        />
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-100 block">Akumulasi Luar Jangka Masa</span>
                          <span className="text-[10px] text-slate-400 mt-1 block leading-tight">Gunting sekatan bulan semasa (berguna untuk projek simpanan tabungan berkekalan)</span>
                        </div>
                      </label>
                    </div>

                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Keterangan Catatan Ringkas</label>
                      <input 
                        type="text"
                        value={budgetInputNote}
                        onChange={(e) => setBudgetInputNote(e.target.value)}
                        placeholder="Nota peribadi..."
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 p-2.5 rounded-xl"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-3 flex gap-2">
                  <button 
                    type="button" 
                    onClick={closeSettingsModal}
                    className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 font-bold uppercase tracking-wider rounded-xl transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold uppercase tracking-wider rounded-xl shadow-lg hover:opacity-90 active:scale-95 transition-all text-center"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================= CUSTOM ENHANCED CONFIRMATION DIALOG ======================= */}
        {confirmModal && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm z-55 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-[360px] rounded-3xl shadow-2xl p-6 animate-fadeIn text-xs text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800">
              <div className="flex flex-col items-center text-center mt-2.5">
                <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-full flex items-center justify-center mb-4.5">
                  <Trash2 className="w-6 h-6" />
                </div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mb-2 leading-tight">
                  {confirmModal.title}
                </h4>
                <p className="text-slate-500 dark:text-slate-350 leading-relaxed font-bold mb-6 px-1.5">
                  {confirmModal.message}
                </p>
                <div className="w-full flex gap-2.5">
                  <button 
                    onClick={() => setConfirmModal(null)}
                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 font-bold uppercase tracking-wider rounded-xl text-slate-700 dark:text-slate-250 transition-all outline-none"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={confirmModal.onConfirm}
                    className="flex-1 py-3 bg-gradient-to-r from-rose-500 to-red-600 hover:opacity-95 font-bold uppercase tracking-wider rounded-xl text-white shadow-lg shadow-rose-500/15 transition-all outline-none"
                  >
                    Padam / Sah
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
