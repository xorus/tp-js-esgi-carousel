<?php
define('USE_DATABASE', true);

if (USE_DATABASE) {
    try {
        $pdo = new PDO('mysql:host=localhost;dbname=test;charset=UTF8', 'root', 'root');
    } catch (Exception $e) {
        exit('connexion impossible ' . $e->getMessage());
    }
}

$action = !empty($_GET['action']) ? $_GET['action'] : 'slides';

header('Content-Type: application/json;charset=utf-8');

switch ($action) {
    case 'slides':
        if (!USE_DATABASE) {
            echo file_get_contents('local-slides.json');
            exit;
        }
        $query = $pdo->query('SELECT `image`, `title`, `description` FROM slides ORDER BY pos ASC');
        $slides = [];

        while ($data = $query->fetchObject()) {
            $slide = [
                'img' => $data->image
            ];
            if (!empty($data->title)) {
                $slide['title'] = $data->title;
            }
            if (!empty($data->description)) {
                $slide['description'] = $data->description;
            }
            $slides[] = $slide;
        }

        echo json_encode($slides);
        break;
    case 'config';
        if (!USE_DATABASE) {
            exit;
        }
        $query = $pdo->query('SELECT `key`, `value`, `type` FROM configuration');
        $config = [];

        while ($data = $query->fetchObject()) {
            if (isset($data->value)) {
                switch ($data->type) {
                    case 'int':
                        $config[$data->key] = intval($data->value);
                        break;
                    case 'boolean':
                        $config[$data->key] = boolval($data->value);
                        break;
                    default:
                        $config[$data->key] = $data->value;
                        break;
                }
            }
        }

        echo json_encode($config);
        break;
}
