from rest_framework.relations import SlugRelatedField


class test:
	def __init__(self, value=1):
		x = value
	
	def __str__(self) -> str:
		return "Hello"
	def __call__(self, *args, **kwds):
		return "i was called"
	
	def fc(self, y):
		self.x = y
	
t = test()

print(t.fc(1))
