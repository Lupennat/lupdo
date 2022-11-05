import Npdo from '../src/index';
import { NpdoAvailableDriver, NpdoDriver } from '../src/types';
import config from './config';
import { companies, users } from './faker';

const populateMysql = async (driver: NpdoAvailableDriver, driverConf: NpdoDriver.Options) => {
    const npdo = new Npdo(driver, driverConf);
    await npdo.exec('DROP TABLE IF EXISTS users;');
    await npdo.exec('DROP TABLE IF EXISTS companies;');
    await npdo.exec(
        'CREATE TABLE `test_db`.`users` (`id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,`name` VARCHAR(255) NOT NULL,`gender` VARCHAR(255) NOT NULL,PRIMARY KEY (`id`));'
    );
    await npdo.exec(
        'CREATE TABLE `test_db`.`companies` (`id` INT UNSIGNED NOT NULL AUTO_INCREMENT,`name` VARCHAR(255) NULL,PRIMARY KEY (`id`));'
    );

    let stmt = await npdo.prepare('INSERT INTO `test_db`.`users` (`name`, `gender`) VALUES (?,?)');
    for (const user of users) {
        await stmt.execute(user);
    }
    stmt = await npdo.prepare('INSERT INTO `test_db`.`companies` (`name`) VALUES (?)');
    for (const company of companies) {
        await stmt.execute(company);
    }
    await npdo.disconnect();
};

const populateSqlite = async (driver: NpdoAvailableDriver, driverConf: NpdoDriver.Options) => {
    const npdo = new Npdo(driver, driverConf);
    await npdo.exec('DROP TABLE IF EXISTS users;');
    await npdo.exec('DROP TABLE IF EXISTS companies;');
    await npdo.exec(
        'CREATE TABLE "users" ("id"	INTEGER NOT NULL UNIQUE,"name" TEXT NOT NULL,"gender" INTEGER NOT NULL,PRIMARY KEY("id" AUTOINCREMENT));'
    );
    await npdo.exec(
        'CREATE TABLE "companies" ("id"	INTEGER NOT NULL UNIQUE,"name" TEXT NOT NULL,PRIMARY KEY("id" AUTOINCREMENT));'
    );
    let stmt = await npdo.prepare('INSERT INTO `users` (`name`, `gender`) VALUES (?,?)');
    for (const user of users) {
        await stmt.execute(user);
    }
    stmt = await npdo.prepare('INSERT INTO `companies` (`name`) VALUES (?)');
    for (const company of companies) {
        await stmt.execute(company);
    }
    await npdo.disconnect();
};

const migrate = async () => {
    await populateMysql('mysql', config.mysql);
    await populateMysql('mariadb', config.mariadb);
    await populateSqlite('sqlite3', config.sqlite3);
};

migrate();
