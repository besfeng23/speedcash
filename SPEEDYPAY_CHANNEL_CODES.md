# 🏦 SpeedyPay Payout Channel Codes Quick Reference

## 📊 **Complete List of 89 Payout Channels**

### 🏛️ **Major Banks (11)**
| procId | Bank Name |
|--------|-----------|
| BOPIPHMMXXX | Bank of the Philippine Islands (BPI) |
| BNORPHMMXXY | Banco de Oro Unibank Inc (BDO) |
| MBTCPHMMXXX | Metrobank |
| UBPHPHMMXXY | Unionbank of the Philippines |
| RCBCPHMMXXX | RCBC |
| TLBPPHMMXXX | LAND BANK OF THE PHILIPPINES |
| CHBKPHMMXXX | China Banking Corporation |
| PNBMPHMMTOD | Philippine National Bank |
| EWBCPHMMXXX | East West Banking Corporation |
| SETCPHMM000 | Security Bank Corporation |
| AUBKPHMMXXX | Asia United Bank |

### 📱 **E-Wallets & Digital (9)**
| procId | Service Name |
|--------|--------------|
| GXCHPHM2XXX | GCASH (G-Xchange Inc) |
| PAPHPHM1XXX | Maya Philippines Inc |
| MYDBPHM2XXX | MAYA BANK INC |
| SPEYPHM2XXX | SpeedyPay Inc |
| LAUIPHM2XXZ | Seabank Philippines Inc |
| SHPHPHM2XXZ | ShopeePay Philippines Inc |
| GOTYPHM2XXX | GoTyme Bank Corporation |
| TDBIPHM2XXX | Tonik Digital Bank Inc |
| UNODPHM2XXX | UnionDigital Bank Inc |

### 🌍 **International Banks (4)**
| procId | Bank Name |
|--------|-----------|
| BKCHPHMMXXX | Bank of China |
| HSBCPHMMXXX | The HSBC Limited |
| MBBEPHMMXXX | Maybank Philippines Inc |
| SCBLPHMMXXX | STANDARD CHARTERED BANK |

### 🏦 **Rural Banks (32)**
| procId | Bank Name |
|--------|-----------|
| BPDIPHM1XXX | BPI Direct BanKo A Savings Bank |
| CAMZPHM2XXX | CARD MRI RIZAL BANK INC |
| CBMFPHM1XXX | CARD Bank Inc |
| CELRPHM1XXX | Cebuana Lhuillier Rural Bank |
| CHSVPHM1XXX | China Bank Savings Inc |
| CIVAPHM1XXX | CITY SAVINGS BANK INC |
| CNRLPHM1XXX | Cantilan Bank Inc |
| CRMHPHM1XXX | CARD SME BANK INC A THRIFT BANK |
| CUOBPHM2XXX | Community Rural Bank of Romblon |
| DUMTPHM1XXX | DUNGGANON BANK INCORPORATED |
| EAWRPHM2XXX | EastWest Rural Bank |
| ENRUPHM1XXX | ENTREPRENEUR RURAL BANK INC |
| EQSNPHM1XXX | Equicom Savings Bank |
| ISTHPHM1XXX | ISLA BANK |
| LESIPHM1XXX | LEGAZPI SAVINGS BANK INC |
| LUDVPHM1XXX | Luzon Development Bank |
| MAARPHM1XXX | Malayan Savings Bank |
| MIOCPHM1XXX | MINDANAO CONSOLIDATED COOPERATIVE |
| MRTCPHM1XXX | Bangko Mabuhay |
| ONNRPHM1XXX | BDO NETWORK BANK |
| OPDVPHM1XXX | AllBank Inc |
| OWNBPHM2XXX | OWN BANK THE RURAL BANK INC |
| PASVPHM1XXX | Pacific Ace Savings Bank |
| PRTOPHM1XXX | PARTNER RURAL BANK |
| PSCOPHM1XXX | Producers Savings Bank Corporation |
| QCDFPHM1XXX | Queen City Development Bank |
| QCRIPHM1XXX | Quezon Capital Rural Bank |
| RARLPHM1XXX | RANG-AY BANK A Rural Bank Inc |
| RUCAPHM1XXX | CAMALIG BANK INC |
| RUGUPHM1XXX | Rural Bank of Guinobatan Inc |
| SUSVPHM1XXX | Sun Savings Bank |
| VBRIPHM2XXX | Vigan Banco Rural Incorporada |
| WEDVPHM1XXX | WEALTH DEVELOPMENT BANK |

### 💳 **Fintech & Payment Services (19)**
| procId | Service Name |
|--------|--------------|
| APHIPHM2XXX | Alipay Philippines Inc |
| BFSRPHM2XXX | Bananapay Fintech Services |
| DCPHPHM1XXX | DCPay Philippines Inc |
| EAGMPHM2XXX | Easy Pay Global EMI Corp |
| ECASPHM2XXX | Ecashpay Asia Inc |
| GHPESGSGXXX | GPAY NETWORK PH Inc |
| IFIPPHM2XXX | INFOSERVE INCORPORATED |
| IREMPHM2XXX | I-Remit Inc |
| MAYCPHM2XXX | MarCoPay Inc |
| OMNPPHM2XXX | OmniPay Inc |
| PAEYPHM2XXX | PayMongo Payments Inc |
| PAHCPHM2XXX | Paynamics Technologies Inc |
| PDAXPHM2XXX | Philippine Digital Asset Exchange |
| PPSFPHM2XXX | PalawanPay |
| SRCPPHM2XXX | Starpay Corporation |
| TAYOPHM2XXX | TAYOCASH INC |
| TRWIPHM2XXX | Wise Pilipinas Inc |
| TRXPPHM2XXX | Traxion Pay Inc |
| USMEPHM2XXX | USSC Money Service Inc |

### 🏛️ **Other Banks (11)**
| procId | Bank Name |
|--------|-----------|
| CIPHPHMMXXX | CIMB BANK PHILIPPINES INC |
| CPHIPHMMXXX | PHILIPPINE BANK OF COMMUNICATIONS |
| CTCBPHMMXXY | CTBC Bank Phils Corp |
| PABIPHMMXXX | Bank Of Commerce |
| PHSBPHMMXXX | Philippine Savings Bank |
| PHTBPHMMXXX | PHILTRUST BANK |
| PHVBPHMMXXX | Philippine Veterans Bank |
| PPBUPHMMXXX | PHILIPPINE BUSINESS BANK |
| ROBPPHMQXXY | ROBINSONS BANK CORPORATION |
| STLAPH22XXX | Sterling Bank of Asia Inc |
| UNOBPHM2XXX | UNOBANK INC |

## 🔧 **Usage Example**

```javascript
// Example payout request to BPI
const payoutRequest = {
  signType: 'SHA256',
  timestamp: '2025-07-22 10:15:40',
  merchSeq: '300000064613',
  orderSeq: 'TEST123456',
  orderDate: '2025-07-22',
  amount: '1000.00',
  fee: '0.00',
  currency: 'PHP',
  procId: 'BOPIPHMMXXX', // BPI Bank
  procDetail: '1234567890', // Account number
  purposes: 'Salary Payment',
  firstName: 'John',
  lastName: 'Doe',
  mobilePhone: '09123456789',
  notifyUrl: 'https://your-domain.com/webhook'
};
```

## 📊 **Summary**
- **Total Channels**: 89
- **Major Banks**: 11
- **E-Wallets & Digital**: 9
- **International Banks**: 4
- **Rural Banks**: 32
- **Fintech & Payment Services**: 19
- **Other Banks**: 11

## 💡 **Quick Tips**
1. Use `procId` in your payout requests to specify destination
2. `procDetail` should contain account number or mobile number
3. All channels support PHP currency
4. Test with small amounts first
5. Monitor webhook responses for transaction status

---
**Last Updated**: 2025-07-22
**Source**: SpeedyPay (eMango Pay) API Documentation v1.1 