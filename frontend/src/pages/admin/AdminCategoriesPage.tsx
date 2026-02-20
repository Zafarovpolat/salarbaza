import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  ChevronRight,
  Package,
  Percent,
  Upload,
  Loader2,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminService } from "@/services/adminService";
import { uploadImage } from "@/lib/supabase";
import toast from "react-hot-toast";

interface Category {
  id: string;
  slug: string;
  nameRu: string;
  nameUz: string;
  descriptionRu?: string;
  descriptionUz?: string;
  image?: string;
  wholesaleTemplateId?: string;
  sortOrder: number;
  isActive: boolean;
  _count?: { products: number };
  wholesaleTemplate?: { id: string; name: string } | null;
}

interface WholesaleTemplate {
  id: string;
  name: string;
  isDefault: boolean;
  tiers: { minQuantity: number; discountPercent: number }[];
}

interface CategoryForm {
  slug: string;
  nameRu: string;
  nameUz: string;
  descriptionRu: string;
  descriptionUz: string;
  image: string;
  sortOrder: number;
  isActive: boolean;
  wholesaleTemplateId: string;
}

const initialForm: CategoryForm = {
  slug: "",
  nameRu: "",
  nameUz: "",
  descriptionRu: "",
  descriptionUz: "",
  image: "",
  sortOrder: 0,
  isActive: true,
  wholesaleTemplateId: "",
};

export function AdminCategoriesPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wholesaleTemplates, setWholesaleTemplates] = useState<
    WholesaleTemplate[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryForm>(initialForm);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadCategories();
    loadWholesaleTemplates();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await adminService.getCategories();
      setCategories(data);
    } catch (error) {
      toast.error("Ошибка загрузки категорий");
    } finally {
      setLoading(false);
    }
  };

  const loadWholesaleTemplates = async () => {
    try {
      const data = await adminService.getWholesaleTemplates();
      setWholesaleTemplates(data);
    } catch (error) {
      console.error("Ошибка загрузки шаблонов");
    }
  };

  const handleEdit = (e: React.MouseEvent, category: Category) => {
    e.stopPropagation();
    setEditingId(category.id);
    setForm({
      slug: category.slug,
      nameRu: category.nameRu,
      nameUz: category.nameUz || "",
      descriptionRu: category.descriptionRu || "",
      descriptionUz: category.descriptionUz || "",
      image: category.image || "",
      sortOrder: category.sortOrder,
      isActive: category.isActive,
      wholesaleTemplateId: category.wholesaleTemplateId || "",
    });
    setShowForm(true);
  };

  const handleNew = () => {
    setEditingId(null);
    setForm(initialForm);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(initialForm);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await uploadImage(file, "categories");
      if (url) {
        setForm((prev) => ({ ...prev, image: url }));
        toast.success("Фото загружено");
      } else {
        toast.error("Ошибка загрузки");
      }
    } catch {
      toast.error("Ошибка загрузки");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const dataToSend = {
        ...form,
        wholesaleTemplateId: form.wholesaleTemplateId || null,
      };

      if (editingId) {
        await adminService.updateCategory(editingId, dataToSend);
        toast.success("Категория обновлена");
      } else {
        await adminService.createCategory(dataToSend);
        toast.success("Категория создана");
      }
      loadCategories();
      handleCancel();
    } catch (error: any) {
      toast.error(error.message || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (
    e: React.MouseEvent,
    id: string,
    name: string,
    productsCount: number,
  ) => {
    e.stopPropagation();

    const message =
      productsCount > 0
        ? `Удалить категорию "${name}"?\n\n⚠️ ${productsCount} товаров останутся без категории.`
        : `Удалить категорию "${name}"?`;

    if (!confirm(message)) return;

    try {
      await adminService.deleteCategory(id);
      toast.success("Категория удалена");
      loadCategories();
    } catch (error: any) {
      toast.error(error.message || "Ошибка удаления");
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/admin/categories/${categoryId}/products`);
  };

  // Получить выбранный шаблон для превью
  const selectedTemplate = wholesaleTemplates.find(
    (t) => t.id === form.wholesaleTemplateId,
  );

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          Категории
        </h1>
        <button
          onClick={handleNew}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl hover:bg-green-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Добавить</span>
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
              <h2 className="text-lg font-semibold">
                {editingId ? "Редактировать" : "Новая категория"}
              </h2>
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug *
                </label>
                <input
                  type="text"
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 outline-none"
                  required
                  disabled={!!editingId}
                  placeholder="moss-panels"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Название (RU) *
                </label>
                <input
                  type="text"
                  name="nameRu"
                  value={form.nameRu}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Название (UZ)
                </label>
                <input
                  type="text"
                  name="nameUz"
                  value={form.nameUz}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Шаблон описания (RU)
                </label>
                <textarea
                  name="descriptionRu"
                  value={form.descriptionRu}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 outline-none resize-none"
                  placeholder="Шаблон описания для товаров этой категории"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Шаблон описания (UZ)
                </label>
                <textarea
                  name="descriptionUz"
                  value={form.descriptionUz}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 outline-none resize-none"
                  placeholder="Tovarlar uchun shablon tavsifi"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Фото категории
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {form.image ? (
                  <div className="relative">
                    <img
                      src={form.image}
                      alt="preview"
                      className="w-full h-36 object-cover rounded-lg border border-gray-200"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, image: "" }))}
                      className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-red-50"
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="absolute bottom-2 right-2 flex items-center gap-1.5 px-3 py-1.5 bg-white/90 text-gray-700 rounded-lg text-xs font-medium shadow hover:bg-white disabled:opacity-50"
                    >
                      {uploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      Заменить
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-1.5 text-gray-500 hover:border-green-400 hover:text-green-600 transition-colors disabled:opacity-50"
                  >
                    {uploadingImage ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <Upload className="w-6 h-6" />
                    )}
                    <span className="text-sm">{uploadingImage ? "Загрузка..." : "Загрузить фото"}</span>
                  </button>
                )}
              </div>

              {/* ✅ Шаблон оптовых скидок */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="flex items-center gap-1">
                    <Percent className="w-4 h-4" />
                    Оптовые скидки для категории
                  </span>
                </label>
                <select
                  name="wholesaleTemplateId"
                  value={form.wholesaleTemplateId}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:border-green-500 outline-none bg-white"
                >
                  <option value="">Не выбран (универсальный)</option>
                  {wholesaleTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}{" "}
                      {template.isDefault ? "(по умолчанию)" : ""}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Скидка применится ко всем товарам категории (если у товара нет
                  своей)
                </p>
              </div>

              {/* Превью выбранного шаблона */}
              {selectedTemplate && (
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-green-800 mb-2">
                    Пороги скидок:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.tiers.map((tier, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium"
                      >
                        {tier.minQuantity}+ шт → -{tier.discountPercent}%
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={form.isActive}
                    onChange={handleChange}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-gray-700">Активна</span>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "..." : "Сохранить"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Categories List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-500">
            Загрузка...
          </div>
        ) : categories.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-500">
            Категории не найдены
          </div>
        ) : (
          categories.map((category) => (
            <div
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className="bg-white rounded-xl p-4 shadow-sm cursor-pointer hover:bg-gray-50 hover:shadow-md transition-all active:scale-[0.99]"
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-gray-900">
                      {category.nameRu}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        category.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {category.isActive ? "Активна" : "Скрыта"}
                    </span>
                    {category.wholesaleTemplate && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 flex items-center gap-1">
                        <Percent className="w-3 h-3" />
                        {category.wholesaleTemplate.name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-gray-500">{category.slug}</p>
                    <span className="text-gray-300">•</span>
                    <div className="flex items-center gap-1 text-sm text-blue-600">
                      <Package className="w-3.5 h-3.5" />
                      <span>{category._count?.products || 0} товаров</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={(e) => handleEdit(e, category)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Редактировать категорию"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) =>
                      handleDelete(
                        e,
                        category.id,
                        category.nameRu,
                        category._count?.products || 0,
                      )
                    }
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Удалить категорию"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronRight className="w-5 h-5 text-gray-400 ml-1" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </AdminLayout>
  );
}
