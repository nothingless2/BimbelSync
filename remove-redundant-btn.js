const fs = require('fs');
const file = 'src/app/superadmin/(dashboard)/billing/client-page.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetBtn = `          <button
            onClick={() => {
              setBankForm({ bankName: bankInfo.bankName, bankAccount: bankInfo.bankAccount });
              setBankModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-sm transition"
          >
            <Landmark size={16} className="text-blue-600 dark:text-blue-400" />
            Rekening Transfer
          </button>`;

const normContent = content.replace(/\r\n/g, '\n');
const normTarget = targetBtn.replace(/\r\n/g, '\n');

if (normContent.includes(normTarget)) {
  const result = normContent.replace(normTarget + '\n', '');
  fs.writeFileSync(file, result, 'utf8');
  console.log("REMOVED HEADER BANK BUTTON SUCCESS");
} else {
  console.error("NOT FOUND");
}

