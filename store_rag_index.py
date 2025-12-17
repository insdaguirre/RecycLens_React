from llama_index.core import SimpleDirectoryReader, VectorStoreIndex
from llama_index.core.node_parser import SentenceSplitter
import yaml
import dotenv

dotenv.load_dotenv()

splitter = SentenceSplitter(chunk_size=800, chunk_overlap=120)
docs = SimpleDirectoryReader("./rag/rag_docs").load_data()

for d in docs:
    text = d.text
    if text.startswith("---"):
        _, yaml_block, _ = text.split("---", 2)
        metadata = yaml.safe_load(yaml_block) or {}
        url = ''
        if (metadata["content_type"] == "pdf"):
            url:str = metadata["source_file"]
        elif(metadata["content_type"] == "html"):
            url:str = metadata["source_url"]
        lastInd =url.rfind("/")
        if (lastInd < len(url) - 1):
            # Get text after last / but ignore anything after a . (to avoid things like .com, .php)
            topic = url[lastInd+1:].split(".")[0]
            metadata["topic"] = topic

    else:
        metadata = {}
    d.metadata.update(metadata)

nodes = splitter.get_nodes_from_documents(docs)
index = VectorStoreIndex(nodes)
index.storage_context.persist("./rag_service/rag_index_morechunked")

# Less chunked code
#docs = SimpleDirectoryReader("./rag/rag_docs").load_data()
#index = VectorStoreIndex.from_documents(docs, show_progress=True)
#index.storage_context.persist(
#    persist_dir=("./rag/rag_index")
#)