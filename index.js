const express = require('express');
const cors = require('cors');
const mercadopago = require('mercadopago');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// Servir arquivos estáticos da pasta "public"
app.use(express.static(path.join(__dirname, 'public')));

// Redirecionar "/" para "index.html"
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Configurar credencial do Mercado Pago
mercadopago.configure({
  access_token: 'APP_USR-4070650114396286-052101-4527cd5c7e344a3679a85472fb2c77ac-329873569' // Substitua pelo seu token real
});

// Rota para gerar QR Code do PIX
app.post('/gerar-pix', async (req, res) => {
  const { valor } = req.body;

  try {
    const pagamento = await mercadopago.payment.create({
      transaction_amount: Number(valor),
      description: "Pagamento com Pix",
      payment_method_id: "pix",
      payer: {
        email: "cliente@email.com",
        first_name: "João",
        last_name: "Silva"
      }
    });

    const dados = pagamento.body.point_of_interaction.transaction_data;
    res.json({
      qrcode: `data:image/png;base64,${dados.qr_code_base64}`,
      copiaecola: dados.qr_code,
      idPagamento: pagamento.body.id
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "Erro ao gerar Pix" });
  }
});

// Rota para pagamento com cartão de crédito
app.post('/pagar-cartao', async (req, res) => {
  const { token, parcelas, email, cpf, valor } = req.body;

  try {
    const pagamento = await mercadopago.payment.create({
      transaction_amount: Number(valor),
      token: token,
      description: "Pagamento com Cartão",
      installments: Number(parcelas),
      payment_method_id: "visa", // Ou outro método dinâmico
      payer: {
        email: email,
        identification: {
          type: "CPF",
          number: cpf
        }
      }
    });

    if (pagamento.body.status === "approved") {
      res.json({ sucesso: true });
    } else {
      res.json({ sucesso: false, erro: pagamento.body.status_detail });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ sucesso: false, erro: "Erro interno" });
  }
});

// Iniciar servidor
app.listen(3000, () => {
  console.log("✅ Servidor rodando em http://localhost:3000");
});
