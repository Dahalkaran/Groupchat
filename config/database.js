const Sequelize=require('sequelize');

const sequelize=new Sequelize('groupchat','root','Dahal@123',{
    dialect: 'mysql',
    host: 'localhost'
});
 module.exports=sequelize;