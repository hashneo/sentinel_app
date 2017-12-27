-- -----------------------------------------------------
-- Schema sentinel
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `sentinel` DEFAULT CHARACTER SET utf8 ;
USE `sentinel` ;

-- -----------------------------------------------------
-- Table `sentinel`.`location`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sentinel`.`location` (
  `id` INT NOT NULL,
  `name` VARCHAR(45) NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `sentinel`.`device_type`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sentinel`.`device_type` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `name_UNIQUE` (`name` ASC))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `sentinel`.`devices`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sentinel`.`devices` (
  `id` INT NOT NULL,
  `uuid` VARCHAR(45) NOT NULL,
  `name` VARCHAR(45) NOT NULL,
  `module_id` VARCHAR(45) NOT NULL,
  `location_id` INT NOT NULL,
  `device_type_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uuid_UNIQUE` (`uuid` ASC),
  UNIQUE INDEX `module_id_UNIQUE` (`module_id` ASC),
  INDEX `fk_devices_location_idx` (`location_id` ASC),
  INDEX `fk_devices_device_type1_idx` (`device_type_id` ASC),
  CONSTRAINT `fk_devices_location`
    FOREIGN KEY (`location_id`)
    REFERENCES `sentinel`.`location` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_devices_device_type1`
    FOREIGN KEY (`device_type_id`)
    REFERENCES `sentinel`.`device_type` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;
