import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, setDoc, doc, deleteDoc } from 'firebase/firestore';

// 1. Firebase Config Anda
const firebaseConfig = {
  apiKey: "AIzaSyDcklHvQv9r6hMq5s8SDpZxrXKDk1p4GNU",
  authDomain: "komitmen-bulanan-raja.firebaseapp.com",
  projectId: "komitmen-bulanan-raja",
  storageBucket: "komitmen-bulanan-raja.firebasestorage.app",
  messagingSenderId: "236902396325",
  appId: "1:236902396325:web:5db69d8def14f5c1ddb84c"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

// 2. Senarai Bulan & Template Asal
const monthsList = [
  "Oktober 2026", "November 2026", "Disember 2026",
  "Januari 2027", "Februari 2027", "Mac 2027", "April 2027",
  "Mei 2027", "Jun 2027", "Julai 2027", "Ogos 2027",
  "September 2027", "Oktober 2027", "November 2027", "Disember 2027"
];

const baseTemplate = [
  { category: "Salary", amount: 5293.00, type: "income" },
  { category: "Yuran Ayra", amount: 500.00, type: "expense" },
  { category: "Rumah", amount: 1300.00, type: "expense" },
  { category: "Kereta", amount: 1170.00, type: "expense" },
  { category: "Ma", amount: 300.00, type: "expense" },
  { category: "Minyak kereta", amount: 100.00, type: "expense" },
  { category: "Bil Unifi", amount: 100.00, type: "expense" },
  { category: "Bil telefon", amount: 80.00, type: "expense" },
  { category: "Bil tnb", amount: 250.00, type: "expense" },
  { category: "CC RHB (Iphone)", amount: 120.00, type: "expense" },
  { category: "CC RHB (Harbin)", amount: 600.00, type: "expense" },
  { category: "(+) Sewa rumah", amount: 700.00, type: "income" },
  { category: "(+) Klaim", amount: 0.00, type: "income" },
  { category: "Ili", amount: 500.00, type: "expense" }
];

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [userId, setUserId] = useState(null);
  const [syncStatus, setSyncStatus] = useState("Menyambung...");
  const [selectedMonth, setSelectedMonth] = useState("Oktober 2026");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const scrollRef = useRef(null);

  // 3. Sambungan Firebase & Tarik Data
  useEffect(() => {
    signInAnonymously(auth).then((userCredential) => {
      const uid = userCredential.user.uid;
      setUserId(uid);
      setSyncStatus("Cloud Sync: Aktif 🟢");

      const unsub = onSnapshot(collection(db, 'users', uid, 'transactions'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTransactions(data);
      });
      return () => unsub();
    }).catch(() => setSyncStatus("Gagal Menyambung 🔴"));
  }, []);

  // 4. Jana Template Jika Bulan Kosong
  useEffect(() => {
    if (userId && transactions.length > 0) {
      const currentMonthData = transactions.filter(t => t.month === selectedMonth);
      if (currentMonthData.length === 0) {
        // Auto-generate template untuk bulan baru
        baseTemplate.forEach((item, index) => {
          const newId = `${selectedMonth.replace(' ', '')}-${index}`;
          setDoc(doc(db, 'users', userId, 'transactions', newId), {
            ...item,
            month: selectedMonth,
            datePaid: "",
            status: item.type === 'income' ? 'Selesai' : 'Tertunggak'
          });
        });
      }
    }
  }, [selectedMonth, transactions, userId]);

  // Pengiraan Dashboard
  const filteredData = transactions.filter(t => t.month === selectedMonth);
  const totalIncome = filteredData.filter(t => t.type === 'income').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalExpense = filteredData.filter(t => t.type === 'expense').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const balance = totalIncome - totalExpense;

  // Fungsi Scroll Bulan
  const scrollMonths = (direction) => {
    const currentIndex = monthsList.indexOf(selectedMonth);
    let newIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < monthsList.length) {
      setSelectedMonth(monthsList[newIndex]);
      const buttonWidth = 120; // anggaran lebar butang
      scrollRef.current.scrollTo({ left: newIndex * buttonWidth, behavior: 'smooth' });
    }
  };

  // Fungsi Tambah & Simpan
  const saveRecord = async (id, data) => {
    if (!userId) return;
    await setDoc(doc(db, 'users', userId, 'transactions', id), data);
    setEditingId(null);
  };

  const addRecord = () => {
    const newId = Date.now().toString();
    const newRecord = { category: "Rekod Baru", amount: 0, type: "expense", month: selectedMonth, datePaid: "", status: "Tertunggak" };
    setEditingId(newId);
    setEditForm(newRecord);
  };

  const deleteRecord = async (id) => {
    if (!userId) return;
    await deleteDoc(doc(db, 'users', userId, 'transactions', id));
  };

  return (
    <div className="min-h-screen bg-[#050B14] text-gray-200 p-4 font-sans selection:bg-cyan-500/30">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            Kewangan Pro
          </h1>
          <span className="text-xs md:text-sm font-mono text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
            {syncStatus}
          </span>
        </div>

        {/* Pemilih Bulan Interaktif */}
        <div className="relative flex items-center mb-8 bg-gray-900/50 p-2 rounded-2xl border border-gray-800 backdrop-blur-md">
          <button onClick={() => scrollMonths('left')} className="p-2 text-cyan-400 hover:text-cyan-300 hover:bg-gray-800 rounded-xl transition-all mr-1">
            ◀
          </button>
          <div ref={scrollRef} className="flex overflow-x-auto gap-2 scrollbar-hide py-2 px-1 w-full snap-x">
            {monthsList.map(month => (
              <button 
                key={month}
                onClick={() => setSelectedMonth(month)}
                className={`snap-center px-5 py-2 rounded-xl whitespace-nowrap font-medium text-sm transition-all duration-300 ${
                  selectedMonth === month 
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)] scale-105' 
                    : 'bg-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`}
              >
                {month}
              </button>
            ))}
          </div>
          <button onClick={() => scrollMonths('right')} className="p-2 text-cyan-400 hover:text-cyan-300 hover:bg-gray-800 rounded-xl transition-all ml-1">
            ▶
          </button>
        </div>

        {/* Dashboard Kewangan */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-5 rounded-2xl bg-gray-900/60 border border-gray-800 backdrop-blur-md shadow-lg relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-bl-full blur-xl group-hover:bg-emerald-500/20 transition-all"></div>
            <p className="text-gray-400 text-sm mb-1">Total Masuk</p>
            <p className="text-2xl font-mono text-emerald-400">RM {totalIncome.toFixed(2)}</p>
          </div>
          <div className="p-5 rounded-2xl bg-gray-900/60 border border-gray-800 backdrop-blur-md shadow-lg relative overflow-hidden group hover:border-rose-500/30 transition-colors">
            <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/10 rounded-bl-full blur-xl group-hover:bg-rose-500/20 transition-all"></div>
            <p className="text-gray-400 text-sm mb-1">Total Keluar</p>
            <p className="text-2xl font-mono text-rose-400">RM {totalExpense.toFixed(2)}</p>
          </div>
          <div className="p-5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.15)] relative overflow-hidden">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-xl"></div>
            <div className="relative">
              <p className="text-cyan-200 text-sm mb-1">Baki Bersih</p>
              <p className="text-3xl font-mono text-cyan-300 font-bold tracking-tight">RM {balance.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-end mb-4 px-1">
          <h2 className="text-lg font-semibold text-gray-300">Transaksi {selectedMonth}</h2>
          <button onClick={addRecord} className="bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-[0_0_10px_rgba(6,182,212,0.2)]">
            + Tambah Rekod
          </button>
        </div>

        {/* Senarai Transaksi & Edit */}
        <div className="bg-gray-900/40 backdrop-blur-md rounded-2xl border border-gray-800 shadow-2xl overflow-hidden mb-10">
          {filteredData.length === 0 ? (
            <div className="p-10 text-center text-gray-500">Menjana data dari awan... (Sila muat semula jika lama)</div>
          ) : (
            filteredData.map((item) => (
              <div key={item.id} className="border-b border-gray-800/60 last:border-0 hover:bg-gray-800/30 transition-all">
                {editingId === item.id ? (
                  // Mod Edit
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-800/50">
                    <input type="text" value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})} placeholder="Kategori" className="bg-gray-900 border border-gray-700 text-white rounded p-2 text-sm focus:border-cyan-500 outline-none" />
                    <input type="number" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: parseFloat(e.target.value) || 0})} placeholder="Jumlah RM" className="bg-gray-900 border border-gray-700 text-white rounded p-2 text-sm focus:border-cyan-500 outline-none" />
                    <select value={editForm.type} onChange={e => setEditForm({...editForm, type: e.target.value})} className="bg-gray-900 border border-gray-700 text-white rounded p-2 text-sm focus:border-cyan-500 outline-none">
                      <option value="expense">Keluar (Tolak)</option>
                      <option value="income">Masuk (Tambah)</option>
                    </select>
                    <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})} className="bg-gray-900 border border-gray-700 text-white rounded p-2 text-sm focus:border-cyan-500 outline-none">
                      <option value="Selesai">Selesai</option>
                      <option value="Tertunggak">Tertunggak</option>
                    </select>
                    <input type="text" value={editForm.datePaid} onChange={e => setEditForm({...editForm, datePaid: e.target.value})} placeholder="Tarikh (cth: 22/10/2026)" className="bg-gray-900 border border-gray-700 text-white rounded p-2 text-sm focus:border-cyan-500 outline-none" />
                    <div className="flex gap-2 justify-end mt-2 md:mt-0">
                      <button onClick={() => saveRecord(item.id, editForm)} className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500 hover:text-white px-3 py-1 rounded text-sm transition-all">Simpan</button>
                      <button onClick={() => setEditingId(null)} className="bg-gray-700 text-gray-300 hover:bg-gray-600 px-3 py-1 rounded text-sm transition-all">Batal</button>
                    </div>
                  </div>
                ) : (
                  // Mod Paparan Biasa
                  <div className="flex justify-between items-center p-4">
                    <div className="flex flex-col">
                      <p className="font-semibold text-gray-200">{item.category}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${item.status === 'Selesai' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-amber-400 border-amber-500/30 bg-amber-500/10'}`}>
                          {item.status}
                        </span>
                        {item.datePaid && <span className="text-xs text-gray-500">{item.datePaid}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className={`font-mono text-base md:text-lg ${item.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {item.type === 'income' ? '+' : '-'} {item.amount.toFixed(2)}
                      </p>
                      <div className="flex flex-col gap-2">
                        <button onClick={() => { setEditingId(item.id); setEditForm(item); }} className="text-cyan-400 hover:text-cyan-300 text-xs font-medium">Edit</button>
                        <button onClick={() => deleteRecord(item.id)} className="text-gray-500 hover:text-rose-500 text-xs">Padam</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}