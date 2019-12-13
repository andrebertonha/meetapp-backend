import File from '../models/File';

class FileController {
  async store(req, res) {
    const { originalname: name, filename: path } = req.file;

    const file = await File.create({
      name,
      path,
    });

    return res.json(file);
  }

  async index(req, res) {
    const file = await File.findByPk(req.params.id);
    const { id, name, path, url } = file;
    return res.json({ id, name, path, url });
  }
}

export default new FileController();
