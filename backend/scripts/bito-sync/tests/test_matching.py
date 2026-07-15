import pathlib,sys,unittest;sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]));from matching import Matcher
class T(unittest.TestCase):
 def test_exact(self):self.assertEqual(Matcher([{'id':'1','code':'B-5-red'}]).find('B-5-red')['id'],'1')
 def test_unrelated(self):self.assertIsNone(Matcher([{'id':'1','code':'B-5-red'}]).find('B-50-red'))
if __name__=='__main__':unittest.main()
