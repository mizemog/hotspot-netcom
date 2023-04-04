const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const { body, validationResult } = require('express-validator');
const dotenv = require('dotenv');
const cors = require('cors');
dotenv.config();

const app = express();

// Configuración del middleware cors
app.use(cors());

// Configuración del puerto
const port = process.env.PORT || 5000;

// Configuración de la base de datos
const sequelize = new Sequelize(process.env.MYSQL_URL, {
dialect: 'mysql'
});


// Definición del modelo de la base de datos
const Usuarios = sequelize.define('usuarios', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre_apellido: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      isEmail: true
    },
    indexes: [{ unique: true, fields: ["email"] }]
  },
  zona_residencial: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  telefono: {
    type: DataTypes.STRING(20),
    allowNull: false
  }
});

app.use(express.json());

// Enviando usuario
app.post('/usuarios', [
  body('nombre_apellido').notEmpty().withMessage('El campo nombre_apellido es requerido'),
  body('email').notEmpty().withMessage('El campo email es requerido'),
  body('email').isEmail().withMessage('El campo email debe ser una dirección de correo electrónico válida'),
  body('zona_residencial').notEmpty().withMessage('El campo zona_residencial es requerido'),
  body('telefono').notEmpty().withMessage('El campo telefono es requerido')
], async (req, res) => {

  // Validación de entrada
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Validación de datos duplicados en el backend
  const { nombre_apellido, email, zona_residencial, telefono } = req.body;
  const usuarioExistente = await Usuarios.findOne({ where: { email } });
  if (usuarioExistente) {
    return res.status(409).json({ message: 'El correo electrónico ya existe en la base de datos' });
  }

  // Guardando en la base de datos
  const nuevoUsuario = await Usuarios.create({
    nombre_apellido,
    email,
    zona_residencial,
    telefono
  });
  return res.json(nuevoUsuario);
});

// Obteniendo usuarios
app.get('/usuarios', async (req, res) => {
  const page = req.query.page || 1;
  const per_page = req.query.per_page || 10;
  const offset = (page - 1) * per_page;
  const limit = per_page;
  const { count, rows: usuarios } = await Usuarios.findAndCountAll({
    offset,
    limit
  });
  return res.json({
    data: usuarios,
    total: count,
    pages: Math.ceil(count / limit)
  });
});

// Verifica si un correo electrónico ya existe en la base de datos
app.post('/usuarios/verificar-correo', [
  body('email').notEmpty().withMessage('El campo email es requerido'),
  body('email').isEmail().withMessage('El campo email debe ser una dirección de correo electrónico válida')
], async (req, res) => {

  // Validación de entrada
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Verificar si el correo electrónico ya existe en la base de datos
  const { email } = req.body;
  const usuarioExistente = await Usuarios.findOne({ where: { email } });

  if (usuarioExistente) {
    return res.status(200).json({ message: 'El correo electrónico ya existe en la base de datos' });
  } else {
    return res.status(409).json({ message: 'El correo electrónico no existe en la base de datos' });
  }
});



// Sincronización de la base de datos y ejecución de la aplicación de Express
sequelize.sync().then(() => {
  app.listen(port, () => {
    console.log("Servidor escuchando en el puerto", port);
  });
});