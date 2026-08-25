import { ProviderWallet, TransactionFilters, TransactionPage } from "@/domain/entities/wallet.types";
import { api } from "../api/client";
import { unwrapApiData } from "../api/unwrap";

/**
 * `SAR` المخزّنة ليست عملة الحساب بل قيمة افتراضية خاطئة تسرّبت من مخطّط
 * المحفظة في الخادم: كان `wallet.schema.ts` يضع `default: 'SAR'` بينما
 * إعدادات المنصّة تعلن `defaultCurrency: 'SYP'` وحسابات الدفع والأرباح كلّها
 * ترجع إليها. فتُنشأ محفظة كل مزوّد بعملة سعودية والمبالغ فيها ليرات سورية.
 *
 * أُصلح الافتراضي في الخلفية، لكن المحافظ المُنشأة قبل ذلك تحمل `SAR` في
 * قاعدة البيانات. هذا السطر يصحّح عرضها حتى تُحدَّث السجلات.
 */
function normalizeCurrency(wallet: ProviderWallet): ProviderWallet {
  return wallet?.currency === "SAR" ? { ...wallet, currency: "SYP" } : wallet;
}

export const getProviderWallet = () =>
  api
    .get("/provider/wallet/me")
    .then((response) => normalizeCurrency(unwrapApiData<ProviderWallet>(response.data)));

export const getProviderTransactions = (filters: TransactionFilters = {}) =>
  api.get("/provider/wallet/transactions", { params: filters }).then((response) => unwrapApiData<TransactionPage>(response.data));
