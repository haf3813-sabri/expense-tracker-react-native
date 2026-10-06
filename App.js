import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  SafeAreaView, 
  StatusBar,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [expenses, setExpenses] = useState([]);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('General');
  
  // Budget, Dark Mode, Filter
  const [budget, setBudget] = useState('2000');
  const [inputBudget, setInputBudget] = useState('2000');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [filterMode, setFilterMode] = useState('all'); // 'all' or 'current_month'

  // Load stored data on startup
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const savedExpenses = await AsyncStorage.getItem('@expenses_key');
      const savedBudget = await AsyncStorage.getItem('@budget_key');
      const savedTheme = await AsyncStorage.getItem('@theme_key');

      if (savedExpenses !== null) setExpenses(JSON.parse(savedExpenses));
      if (savedBudget !== null) {
        setBudget(savedBudget);
        setInputBudget(savedBudget);
      }
      if (savedTheme !== null) setIsDarkMode(JSON.parse(savedTheme));
    } catch (error) {
      console.log('Error loading data:', error);
    }
  };

  // Save monthly budget
  const saveBudget = async () => {
    try {
      setBudget(inputBudget);
      await AsyncStorage.setItem('@budget_key', inputBudget);
      Alert.alert('Success', 'Monthly budget updated successfully!');
    } catch (error) {
      console.log('Error saving budget:', error);
    }
  };

  // Toggle and save theme
  const toggleTheme = async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    try {
      await AsyncStorage.setItem('@theme_key', JSON.stringify(newTheme));
    } catch (error) {
      console.log('Error saving theme:', error);
    }
  };

  // Add new expense
  const addExpense = async () => {
    if (!title || !amount) return;

    const newExpense = {
      id: Date.now().toString(),
      title: title,
      amount: parseFloat(amount),
      category: category || 'General',
      date: new Date().toLocaleDateString('en-US'),
      rawDate: new Date().toISOString(),
    };

    const updatedExpenses = [newExpense, ...expenses];
    setExpenses(updatedExpenses);

    try {
      await AsyncStorage.setItem('@expenses_key', JSON.stringify(updatedExpenses));
    } catch (error) {
      console.log('Error saving expense:', error);
    }

    setTitle('');
    setAmount('');
    setCategory('General');
  };

  // Delete expense
  const deleteExpense = async (id) => {
    const updatedExpenses = expenses.filter((item) => item.id !== id);
    setExpenses(updatedExpenses);
    try {
      await AsyncStorage.setItem('@expenses_key', JSON.stringify(updatedExpenses));
    } catch (error) {
      console.log('Error deleting expense:', error);
    }
  };

  // Export data to CSV
  const exportToCSV = () => {
    if (expenses.length === 0) {
      Alert.alert('Notice', 'No expenses available to export.');
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,ID,Title,Amount,Category,Date\n";
    expenses.forEach(item => {
      csvContent += `${item.id},"${item.title}",${item.amount},"${item.category}",${item.date}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    
    if (typeof window !== 'undefined' && window.document) {
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Expenses_Report_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      Alert.alert('CSV Export', 'CSV report generated successfully!');
    }
  };

  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const filteredExpenses = expenses.filter(item => {
    if (filterMode === 'current_month' && item.rawDate) {
      const d = new Date(item.rawDate);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }
    return true;
  });

  const totalAmount = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);
  const budgetNum = parseFloat(budget) || 0;
  const budgetPercentage = budgetNum > 0 ? Math.min((totalAmount / budgetNum) * 100, 100) : 0;

  // Budget status colors
  let budgetColor = '#10B981'; // Green
  if (budgetPercentage >= 80 && budgetPercentage < 100) budgetColor = '#F59E0B'; // Amber
  if (budgetPercentage >= 100) budgetColor = '#EF4444'; // Red

  const theme = isDarkMode ? darkStyles : lightStyles;

  return (
    <SafeAreaView style={[styles.container, theme.bg]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      {/* Top Bar Actions */}
      <View style={styles.topActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={toggleTheme}>
          <Text style={styles.actionBtnText}>{isDarkMode ? '☀️ Light' : '🌙 Dark'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#10B981' }]} onPress={exportToCSV}>
          <Text style={styles.actionBtnText}>📄 Export CSV</Text>
        </TouchableOpacity>
      </View>

      {/* Header & Budget Dashboard */}
      <View style={[styles.headerBox, theme.card]}>
        <Text style={[styles.headerTitle, theme.text]}>Expense Tracker 💸</Text>
        <Text style={[styles.totalText, theme.subText]}>
          Total Expenses: ${totalAmount.toFixed(2)}
        </Text>

        {/* Budget Progress Bar */}
        <View style={styles.budgetProgressBox}>
          <View style={styles.budgetHeader}>
            <Text style={[styles.budgetText, theme.text]}>Budget: ${budgetNum}</Text>
            <Text style={{ color: budgetColor, fontWeight: 'bold' }}>
              {budgetPercentage.toFixed(0)}%
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${budgetPercentage}%`, backgroundColor: budgetColor }]} />
          </View>
          {budgetPercentage >= 100 && (
            <Text style={styles.warningText}>⚠️ Warning: You have exceeded your budget!</Text>
          )}
          {budgetPercentage >= 80 && budgetPercentage < 100 && (
            <Text style={styles.warningTextYellow}>⚡ Alert: You are close to your budget limit!</Text>
          )}
        </View>

        {/* Edit Budget Input */}
        <View style={styles.budgetInputRow}>
          <TextInput
            style={[styles.smallInput, theme.input]}
            placeholder="Set Budget"
            placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
            keyboardType="numeric"
            value={inputBudget}
            onChangeText={setInputBudget}
          />
          <TouchableOpacity style={styles.saveBudgetBtn} onPress={saveBudget}>
            <Text style={styles.saveBudgetBtnText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity 
          style={[styles.filterBtn, filterMode === 'all' && styles.filterBtnActive]} 
          onPress={() => setFilterMode('all')}
        >
          <Text style={filterMode === 'all' ? styles.filterTextActive : theme.text}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterBtn, filterMode === 'current_month' && styles.filterBtnActive]} 
          onPress={() => setFilterMode('current_month')}
        >
          <Text style={filterMode === 'current_month' ? styles.filterTextActive : theme.text}>This Month</Text>
        </TouchableOpacity>
      </View>

      {/* Input Form */}
      <View style={[styles.inputCard, theme.card]}>
        <TextInput
          style={[styles.input, theme.input]}
          placeholder="Expense title (e.g., Coffee)"
          placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={[styles.input, theme.input]}
          placeholder="Amount ($)"
          placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />
        <TextInput
          style={[styles.input, theme.input]}
          placeholder="Category (e.g., Food, Shopping)"
          placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
          value={category}
          onChangeText={setCategory}
        />
        <TouchableOpacity style={styles.addButton} onPress={addExpense}>
          <Text style={styles.addButtonText}>+ Add Expense</Text>
        </TouchableOpacity>
      </View>

      {/* Expenses List */}
      <FlatList
        data={filteredExpenses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.expenseItem, theme.card]}>
            <View>
              <Text style={[styles.expenseTitle, theme.text]}>{item.title}</Text>
              <Text style={styles.expenseCategory}>🏷️ {item.category} • {item.date}</Text>
            </View>
            <View style={styles.rightSection}>
              <Text style={styles.expenseAmount}>-${item.amount.toFixed(2)}</Text>
              <TouchableOpacity onPress={() => deleteExpense(item.id)} style={styles.deleteBtn}>
                <Text style={styles.deleteBtnText}>❌</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={[styles.emptyText, theme.subText]}>No expenses recorded yet ✨</Text>
        }
      />
    </SafeAreaView>
  );
}

// Global Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 15,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  topActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  actionBtn: {
    backgroundColor: '#6366F1', // Indigo Accent
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  headerBox: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  totalText: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 12,
  },
  budgetProgressBox: {
    marginVertical: 10,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  budgetText: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBarBg: {
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  warningText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 6,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  warningTextYellow: {
    color: '#F59E0B',
    fontSize: 12,
    marginTop: 6,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  budgetInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  smallInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    textAlign: 'left',
    fontSize: 13,
  },
  saveBudgetBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 8,
  },
  saveBudgetBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  filterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 22,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginHorizontal: 6,
  },
  filterBtnActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  inputCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    textAlign: 'left',
    fontSize: 14,
  },
  addButton: {
    backgroundColor: '#10B981', // Emerald Green
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  expenseItem: {
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  expenseTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  expenseCategory: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 3,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenseAmount: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#EF4444',
    marginRight: 10,
  },
  deleteBtn: {
    padding: 4,
  },
  deleteBtnText: {
    fontSize: 13,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 14,
  },
});

// Color Themes (Light & Dark)
const lightStyles = StyleSheet.create({
  bg: { backgroundColor: '#F8FAFC' }, 
  card: { backgroundColor: '#FFFFFF' },
  text: { color: '#0F172A' },
  subText: { color: '#475569' },
  input: { borderColor: '#E2E8F0', backgroundColor: '#F8FAFC', color: '#0F172A' },
});

const darkStyles = StyleSheet.create({
  bg: { backgroundColor: '#0F172A' }, 
  card: { backgroundColor: '#1E293B' },
  text: { color: '#F8FAFC' },
  subText: { color: '#94A3B8' },
  input: { borderColor: '#334155', backgroundColor: '#334155', color: '#F8FAFC' },
});