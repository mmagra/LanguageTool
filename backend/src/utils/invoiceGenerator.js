const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate a PDF invoice for a payment
 * @param {Object} payment - Payment object with all details
 * @param {Object} school - School object
 * @returns {Promise<string>} - Path to generated PDF
 */
const generateInvoice = async (payment, school) => {
    return new Promise((resolve, reject) => {
        try {
            // Create invoices directory if it doesn't exist
            const invoicesDir = path.join(__dirname, '../../invoices');
            if (!fs.existsSync(invoicesDir)) {
                fs.mkdirSync(invoicesDir, { recursive: true });
            }

            // Generate invoice number if not exists
            const invoiceNumber = payment.invoice_number || `INV-${Date.now()}`;
            const filename = `${invoiceNumber}.pdf`;
            const filepath = path.join(invoicesDir, filename);

            // Create PDF document
            const doc = new PDFDocument({ margin: 50 });
            const stream = fs.createWriteStream(filepath);

            doc.pipe(stream);

            // Header
            doc.fontSize(20)
                .text('INVOICE', 50, 50, { align: 'right' })
                .fontSize(10)
                .text(`Invoice #: ${invoiceNumber}`, 50, 80, { align: 'right' })
                .text(`Date: ${new Date(payment.payment_date).toLocaleDateString()}`, 50, 95, { align: 'right' });

            // Company Info (Left side)
            doc.fontSize(12)
                .text('Spoken Edge', 50, 50)
                .fontSize(10)
                .text('Language Learning Platform', 50, 70)
                .text('support@spokenedge.com', 50, 85);

            // Bill To
            doc.fontSize(12)
                .text('Bill To:', 50, 150)
                .fontSize(10)
                .text(school.name, 50, 170)
                .text(school.contact_email || '', 50, 185)
                .text(school.contact_number || '', 50, 200);

            // Line separator
            doc.moveTo(50, 240)
                .lineTo(550, 240)
                .stroke();

            // Table Header
            const tableTop = 260;
            doc.fontSize(10)
                .font('Helvetica-Bold')
                .text('Description', 50, tableTop)
                .text('Period', 250, tableTop)
                .text('Amount', 450, tableTop, { align: 'right' });

            // Table Row
            const rowTop = tableTop + 25;
            doc.font('Helvetica')
                .text(`${school.plan_tier.toUpperCase()} Plan Subscription`, 50, rowTop)
                .text(
                    payment.billing_period_start && payment.billing_period_end
                        ? `${new Date(payment.billing_period_start).toLocaleDateString()} - ${new Date(payment.billing_period_end).toLocaleDateString()}`
                        : '-',
                    250,
                    rowTop
                )
                .text(`$${parseFloat(payment.amount).toFixed(2)}`, 450, rowTop, { align: 'right' });

            // Line separator
            doc.moveTo(50, rowTop + 30)
                .lineTo(550, rowTop + 30)
                .stroke();

            // Total
            const totalTop = rowTop + 50;
            doc.fontSize(12)
                .font('Helvetica-Bold')
                .text('Total:', 350, totalTop)
                .text(`$${parseFloat(payment.amount).toFixed(2)}`, 450, totalTop, { align: 'right' });

            // Payment Status
            const statusTop = totalTop + 40;
            const statusColor = payment.status === 'paid' ? '#10b981' : payment.status === 'pending' ? '#f59e0b' : '#ef4444';
            doc.fontSize(10)
                .fillColor(statusColor)
                .text(`Status: ${payment.status.toUpperCase()}`, 50, statusTop);

            // Payment Method
            if (payment.payment_method) {
                doc.fillColor('#000000')
                    .text(`Payment Method: ${payment.payment_method.replace('_', ' ').toUpperCase()}`, 50, statusTop + 20);
            }

            // Notes
            if (payment.notes) {
                doc.fontSize(10)
                    .fillColor('#666666')
                    .text('Notes:', 50, statusTop + 60)
                    .text(payment.notes, 50, statusTop + 75, { width: 500 });
            }

            // Footer
            doc.fontSize(8)
                .fillColor('#999999')
                .text(
                    'Thank you for your business!',
                    50,
                    700,
                    { align: 'center', width: 500 }
                );

            // Finalize PDF
            doc.end();

            stream.on('finish', () => {
                resolve(filepath);
            });

            stream.on('error', (err) => {
                reject(err);
            });

        } catch (error) {
            reject(error);
        }
    });
};

module.exports = { generateInvoice };
