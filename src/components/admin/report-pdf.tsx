'use client';

import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';
import type { Transaction, TransactionType, TransactionDirection } from '@/types';

Font.register({
  family: 'NotoSans',
  fonts: [
    { src: '/fonts/NotoSans-Regular.woff2', fontWeight: 'normal' },
    { src: '/fonts/NotoSans-Bold.woff2', fontWeight: 'bold' },
  ],
});

type ReportType = 'transaction_activity' | 'commission_summary' | 'partner_performance' | 'demo_prospective';

const reportTypeLabels: Record<ReportType, string> = {
  transaction_activity: 'Islem Aktivite Raporu',
  commission_summary: 'Komisyon Ozet Raporu',
  partner_performance: 'Partner Performans Raporu',
  demo_prospective: 'Demo & Potansiyel Musteri Raporu',
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'NotoSans',
    fontSize: 10,
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 10,
  },
  companyTitle: {
    fontSize: 20,
    fontFamily: 'NotoSans',
    fontWeight: 'bold',
    color: '#003087',
    marginBottom: 4,
  },
  reportTitle: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  metaInfo: {
    fontSize: 9,
    color: '#666',
    marginBottom: 2,
  },
  summarySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  summaryLabel: {
    fontSize: 9,
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: 18,
    fontFamily: 'NotoSans',
    fontWeight: 'bold',
  },
  incomeColor: {
    color: '#00A303',
  },
  expenseColor: {
    color: '#E61E00',
  },
  netColor: {
    color: '#003087',
  },
  tableHeader: {
    backgroundColor: '#003087',
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    padding: 8,
    flexDirection: 'row',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tableRowAlt: {
    backgroundColor: '#f9f9f9',
  },
  tableCell: {
    padding: 8,
    fontSize: 9,
  },
  cellDate: {
    width: '12%',
  },
  cellParty: {
    width: '20%',
  },
  cellType: {
    width: '15%',
  },
  cellDescription: {
    width: '25%',
  },
  cellAmount: {
    width: '15%',
    textAlign: 'right',
  },
  cellDirection: {
    width: '13%',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#999',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  pageNumber: {
    textAlign: 'right',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 7,
    textTransform: 'uppercase',
  },
  badgeCommission: {
    backgroundColor: '#dcfed7',
    color: '#166400',
  },
  badgeDemoBonus: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
  },
  badgeSetupFee: {
    backgroundColor: '#ede9fe',
    color: '#5b21b6',
  },
  badgeCustomer: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  badgeRefund: {
    backgroundColor: '#fed7aa',
    color: '#c2410c',
  },
  incomeBadge: {
    backgroundColor: '#dcfed7',
    color: '#166400',
  },
  expenseBadge: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  noData: {
    textAlign: 'center',
    padding: 40,
    color: '#999',
    fontSize: 12,
  },
});

const typeLabels: Record<TransactionType, string> = {
  commission: 'Komisyon',
  demo_bonus: 'Demo Bonus',
  setup_fee: 'Kurulum Ucreti',
  customer_payment: 'Musteri Odemesi',
  refund: 'Iade',
  other: 'Diger',
};

const directionLabels: Record<TransactionDirection, string> = {
  income: 'Gelir',
  expense: 'Giden',
};

interface ReportPDFProps {
  transactions: Transaction[];
  dateRange: {
    startDate?: string;
    endDate?: string;
    label?: string;
  };
  summary: {
    totalIncome: number;
    totalExpense: number;
    net: number;
    count: number;
  };
  companyName?: string;
  reportType?: ReportType;
  reportTitle?: string;
}

export function TransactionReportPDF({ transactions, dateRange, summary, companyName, reportType = 'transaction_activity', reportTitle }: ReportPDFProps) {
  const title = reportTitle || reportTypeLabels[reportType];

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    const symbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      PHP: '₱',
      VND: '₫',
      THB: '฿',
    };
    const symbol = symbols[currency] || '$';
    return `${symbol}${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getBadgeStyle = (type: TransactionType) => {
    switch (type) {
      case 'commission':
        return styles.badgeCommission;
      case 'demo_bonus':
        return styles.badgeDemoBonus;
      case 'setup_fee':
        return styles.badgeSetupFee;
      case 'customer_payment':
        return styles.badgeCustomer;
      case 'refund':
        return styles.badgeRefund;
      default:
        return {};
    }
  };

  const rowsPerPage = 20;

  const renderHeaderRow = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.tableCell, styles.cellDate]}>Tarih</Text>
      <Text style={[styles.tableCell, styles.cellParty]}>Partner</Text>
      <Text style={[styles.tableCell, styles.cellType]}>Tip</Text>
      <Text style={[styles.tableCell, styles.cellDescription]}>Aciklama</Text>
      <Text style={[styles.tableCell, styles.cellAmount]}>Tutar</Text>
      <Text style={[styles.tableCell, styles.cellDirection]}>Yon</Text>
    </View>
  );

  const renderTransactionRow = (transaction: Transaction, idx: number) => (
    <View key={transaction.id} style={idx % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}>
      <Text style={[styles.tableCell, styles.cellDate]}>
        {format(new Date(transaction.created_at), 'dd/MM/yyyy')}
      </Text>
      <Text style={[styles.tableCell, styles.cellParty]}>
        {transaction.partner_name || 'Musteri'}
      </Text>
      <Text style={[styles.tableCell, styles.cellType]}>
        <Text style={[styles.badge, getBadgeStyle(transaction.type)]}>
          {typeLabels[transaction.type]}
        </Text>
      </Text>
      <Text style={[styles.tableCell, styles.cellDescription]}>
        {transaction.description || '-'}
      </Text>
      <Text style={[styles.tableCell, styles.cellAmount]}>
        {formatCurrency(transaction.amount, transaction.currency)}
      </Text>
      <Text style={[styles.tableCell, styles.cellDirection]}>
        <Text style={[
          styles.badge,
          transaction.direction === 'income' ? styles.incomeBadge : styles.expenseBadge
        ]}>
          {directionLabels[transaction.direction]}
        </Text>
      </Text>
    </View>
  );

  const renderPage = (pageTransactions: Transaction[], pageIndex: number, total: number) => (
    <Page key={`page-${pageIndex}`} size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.companyTitle}>{companyName || 'ClinixGlow & Graftscope'}</Text>
        <Text style={styles.reportTitle}>{title}</Text>
        <Text style={styles.metaInfo}>
          Tarih Araligi: {dateRange.startDate && dateRange.endDate 
            ? `${format(new Date(dateRange.startDate), 'dd/MM/yyyy')} - ${format(new Date(dateRange.endDate), 'dd/MM/yyyy')}`
            : dateRange.label || 'Tumu'}
        </Text>
        <Text style={styles.metaInfo}>
          Olusturulma Tarihi: {format(new Date(), 'dd/MM/yyyy HH:mm')}
        </Text>
      </View>

      <View style={styles.summarySection}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Toplam Gelir</Text>
          <Text style={[styles.summaryValue, styles.incomeColor]}>
            {formatCurrency(summary.totalIncome)}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Toplam Giden</Text>
          <Text style={[styles.summaryValue, styles.expenseColor]}>
            {formatCurrency(summary.totalExpense)}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Net Bakiye</Text>
          <Text style={[styles.summaryValue, styles.netColor]}>
            {formatCurrency(summary.net)}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Toplam Islem</Text>
          <Text style={[styles.summaryValue]}>
            {summary.count}
          </Text>
        </View>
      </View>

      {renderHeaderRow()}
      
      {pageTransactions.map((transaction, idx) => renderTransactionRow(transaction, idx))}

      <View style={styles.footer} fixed>
        <Text>Gizli ve Gizlilik: ClinixGlow & Graftscope Partner Dashboard</Text>
        <Text render={({ pageNumber, totalPages }) => `Sayfa ${pageNumber} / ${totalPages}`} />
      </View>
    </Page>
  );

  const pages: Transaction[][] = [];
  for (let i = 0; i < transactions.length; i += rowsPerPage) {
    pages.push(transactions.slice(i, i + rowsPerPage));
  }

  if (pages.length === 0) {
    pages.push([]);
  }

  return (
    <Document>
      {pages.map((pageTransactions, idx) => 
        renderPage(pageTransactions, idx, pages.length)
      )}
    </Document>
  );
}